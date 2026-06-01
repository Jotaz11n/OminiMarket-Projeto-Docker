const express = require('express');
const db      = require('../config/database');
const router  = express.Router();

// ── GET /api/admin/dashboard ─────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    // KPIs principais
    const [[{ total_usuarios }]] = await db.query('SELECT COUNT(*) AS total_usuarios FROM usuarios WHERE is_admin = 0');
    const [[{ total_produtos }]] = await db.query("SELECT COUNT(*) AS total_produtos FROM produtos WHERE status = 'ativo'");
    const [[{ total_pedidos }]]  = await db.query('SELECT COUNT(*) AS total_pedidos FROM pedidos');
    const [[{ receita_aprovada }]] = await db.query(
      "SELECT COALESCE(SUM(total),0) AS receita_aprovada FROM pedidos WHERE status IN ('pago','enviado','entregue')"
    );
    const [[{ aguardando_total }]] = await db.query(
      "SELECT COALESCE(SUM(total),0) AS aguardando_total FROM pedidos WHERE status = 'aguardando_pagamento'"
    );
    const [[{ qtd_aguardando }]] = await db.query(
      "SELECT COUNT(*) AS qtd_aguardando FROM pedidos WHERE status = 'aguardando_pagamento'"
    );
    const [[{ cancelados }]] = await db.query(
      "SELECT COUNT(*) AS cancelados FROM pedidos WHERE status = 'cancelado'"
    );

    // Pedidos por status
    const [pedidos_por_status] = await db.query(
      'SELECT status, COUNT(*) AS qtd, COALESCE(SUM(total),0) AS volume FROM pedidos GROUP BY status'
    );

    // Receita dos últimos 7 dias (por dia)
    const [receita_semanal] = await db.query(`
      SELECT DATE(criado_em) AS dia,
             COUNT(*) AS qtd_pedidos,
             COALESCE(SUM(total),0) AS receita
      FROM pedidos
      WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND status IN ('pago','enviado','entregue')
      GROUP BY DATE(criado_em)
      ORDER BY dia ASC
    `);

    // Top 5 produtos mais vendidos
    const [top_produtos] = await db.query(`
      SELECT p.id, p.titulo, p.total_vendas, p.preco, p.estoque,
             c.nome AS categoria_nome, pi.url AS imagem
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN produto_imagens pi ON pi.produto_id = p.id AND pi.principal = 1
      ORDER BY p.total_vendas DESC LIMIT 5
    `);

    // Vendas por categoria
    const [vendas_categoria] = await db.query(`
      SELECT c.nome AS categoria, c.icone,
             COUNT(DISTINCT p.id) AS qtd_produtos,
             COALESCE(SUM(p.total_vendas),0) AS total_vendas
      FROM categorias c
      LEFT JOIN produtos p ON p.categoria_id = c.id AND p.status = 'ativo'
      GROUP BY c.id, c.nome, c.icone
      ORDER BY total_vendas DESC
    `);

    // Últimos 5 usuários cadastrados
    const [novos_usuarios] = await db.query(`
      SELECT id, nome, email, criado_em
      FROM usuarios WHERE is_admin = 0
      ORDER BY criado_em DESC LIMIT 5
    `);

    // Pedidos aguardando aprovação de pagamento (urgentes)
    const [pedidos_urgentes] = await db.query(`
      SELECT p.id, p.total, p.metodo_pagamento, p.criado_em,
             u.nome AS comprador_nome, u.email AS comprador_email,
             COUNT(pi.id) AS qtd_itens
      FROM pedidos p
      LEFT JOIN usuarios u ON u.id = p.comprador_id
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      WHERE p.status = 'aguardando_pagamento'
      GROUP BY p.id, p.total, p.metodo_pagamento, p.criado_em, u.nome, u.email
      ORDER BY p.criado_em ASC
      LIMIT 10
    `);

    res.json({
      kpis: { 
        total_usuarios: Number(total_usuarios || 0), 
        total_produtos: Number(total_produtos || 0), 
        total_pedidos: Number(total_pedidos || 0), 
        receita_aprovada, aguardando_total, qtd_aguardando, cancelados 
      },
      pedidos_por_status,
      receita_semanal,
      top_produtos,
      vendas_categoria,
      novos_usuarios,
      pedidos_urgentes,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/pedidos ───────────────────────────────────────────
router.get('/pedidos', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, COUNT(pi.id) AS qtd_itens,
             u.nome AS comprador_nome, u.email AS comprador_email
      FROM pedidos p
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      LEFT JOIN usuarios u ON u.id = p.comprador_id
      GROUP BY p.id
      ORDER BY p.criado_em DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/produtos ──────────────────────────────────────────
router.get('/produtos', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.nome AS vendedor_nome, c.nome AS categoria_nome,
             pi.url AS imagem_principal
      FROM produtos p
      LEFT JOIN usuarios u ON u.id = p.vendedor_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN produto_imagens pi ON pi.produto_id = p.id AND pi.principal = 1
      ORDER BY p.criado_em DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/usuarios ──────────────────────────────────────────
router.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nome, email, cpf, telefone, reputacao, is_admin, criado_em FROM usuarios ORDER BY criado_em DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/usuarios/:id/admin ─────────────────────────────
router.patch('/usuarios/:id/admin', async (req, res) => {
  const { is_admin } = req.body;
  if (typeof is_admin !== 'boolean') return res.status(400).json({ erro: 'is_admin deve ser boolean' });
  if (parseInt(req.params.id) === req.usuario.id)
    return res.status(400).json({ erro: 'Você não pode alterar sua própria permissão' });
  try {
    await db.query('UPDATE usuarios SET is_admin=? WHERE id=?', [is_admin, req.params.id]);
    res.json({ mensagem: is_admin ? 'Promovido a admin!' : 'Permissão removida!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/pedidos/:id/pagamento ──────────────────────────
// Aprovar → status = 'pago'   |   Reprovar → status = 'cancelado'
router.patch('/pedidos/:id/pagamento', async (req, res) => {
  const { acao } = req.body; // 'aprovar' | 'reprovar'
  if (!['aprovar', 'reprovar'].includes(acao))
    return res.status(400).json({ erro: "acao deve ser 'aprovar' ou 'reprovar'" });

  const novoStatus = acao === 'aprovar' ? 'pago' : 'cancelado';
  try {
    const [rows] = await db.query(
      "SELECT id, status FROM pedidos WHERE id = ? AND status = 'aguardando_pagamento'",
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ erro: 'Pedido não encontrado ou não está aguardando pagamento' });

    await db.query('UPDATE pedidos SET status=?, atualizado_em=NOW() WHERE id=?', [novoStatus, req.params.id]);

    // Se reprovado, devolve estoque
    if (acao === 'reprovar') {
      await db.query(`
        UPDATE produtos p
        JOIN pedido_itens pi ON pi.produto_id = p.id
        SET p.estoque = p.estoque + pi.quantidade,
            p.total_vendas = GREATEST(0, p.total_vendas - pi.quantidade)
        WHERE pi.pedido_id = ?
      `, [req.params.id]);
    }

    res.json({ mensagem: acao === 'aprovar' ? 'Pagamento aprovado!' : 'Pagamento reprovado e estoque devolvido!', status: novoStatus });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
// Dedo-duro de erros fatais
process.on('uncaughtException', (err) => {
  console.error('🔥 CRASH FATAL (uncaughtException):', err);
});

process.on('unhandledRejection', (err) => {
  console.error('🔥 REJEIÇÃO FATAL (unhandledRejection):', err);
});
