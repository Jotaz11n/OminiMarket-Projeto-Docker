const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');
const router  = express.Router();

// POST /api/pedidos  – finalizar compra (checkout)
router.post('/', auth, async (req, res) => {
  const { endereco_id, metodo_pagamento = 'pix' } = req.body;

  // REGRA DE NEGÓCIO: Bloqueia a compra caso nenhum endereço tenha sido selecionado
  if (!endereco_id) {
    return res.status(400).json({ erro: 'É obrigatório selecionar um endereço cadastrado para concluir o pedido.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Busca os dados do endereço selecionado para validar a UF e calcular o frete
    const [enderecos] = await conn.query(
      'SELECT estado FROM enderecos WHERE id = ? AND usuario_id = ?',
      [endereco_id, req.usuario.id]
    );

    if (enderecos.length === 0) {
      await conn.rollback();
      return res.status(404).json({ erro: 'O endereço de entrega selecionado não foi encontrado ou não pertence a este usuário.' });
    }

    const uf = enderecos[0].estado.toUpperCase().trim();

    // REGRA DE NEGÓCIO: Se for de São Paulo (SP) o frete é grátis, senão custa R$ 25,00
    const valorFrete = uf === 'SP' ? 0.00 : 25.00;

    // Busca itens do carrinho
    const [itens] = await conn.query(
      `SELECT c.quantidade, p.id AS produto_id, p.preco, p.estoque, p.titulo
       FROM carrinho c JOIN produtos p ON p.id = c.produto_id
       WHERE c.usuario_id = ?`,
      [req.usuario.id]
    );
    if (itens.length === 0) {
      await conn.rollback();
      return res.status(400).json({ erro: 'Carrinho vazio' });
    }

    // Verifica estoque
    for (const item of itens) {
      if (item.estoque < item.quantidade) {
        await conn.rollback();
        return res.status(400).json({ erro: `Estoque insuficiente para: ${item.titulo}` });
      }
    }

    // Subtotal dos produtos
    const subtotal = itens.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    
    // REGRA DE NEGÓCIO: O total final do pedido agora soma o subtotal dos produtos + o frete gerado
    const totalComFrete = subtotal + valorFrete;

    // Cria pedido incluindo as novas colunas: endereco_id, valor_frete e o total atualizado
    const [pedido] = await conn.query(
      'INSERT INTO pedidos (comprador_id, total, endereco_id, valor_frete, metodo_pagamento) VALUES (?, ?, ?, ?, ?)',
      [req.usuario.id, totalComFrete.toFixed(2), endereco_id, valorFrete.toFixed(2), metodo_pagamento]
    );

    // Insere itens e desconta estoque
    for (const item of itens) {
      await conn.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unit) VALUES (?, ?, ?, ?)',
        [pedido.insertId, item.produto_id, item.quantidade, item.preco]
      );
      await conn.query(
        'UPDATE produtos SET estoque = estoque - ?, total_vendas = total_vendas + ? WHERE id = ?',
        [item.quantidade, item.quantidade, item.produto_id]
      );
    }

    // Limpa carrinho
    await conn.query('DELETE FROM carrinho WHERE usuario_id = ?', [req.usuario.id]);

    await conn.commit();
    res.status(201).json({ 
      mensagem: 'Pedido realizado com sucesso!', 
      pedido_id: pedido.insertId, 
      total: parseFloat(totalComFrete.toFixed(2)),
      frete_aplicado: valorFrete
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ erro: 'Erro ao finalizar pedido', detalhe: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/pedidos  – meus pedidos
router.get('/', auth, async (req, res) => {
  try {
    const [pedidos] = await db.query(
      `SELECT p.*, COUNT(pi.id) AS qtd_itens
       FROM pedidos p
       LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
       WHERE p.comprador_id = ?
       GROUP BY p.id
       ORDER BY p.criado_em DESC`,
      [req.usuario.id]
    );
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/pedidos/:id  – detalhe do pedido
router.get('/:id', auth, async (req, res) => {
  try {
    const [pedido] = await db.query('SELECT * FROM pedidos WHERE id=? AND comprador_id=?', [req.params.id, req.usuario.id]);
    if (pedido.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado' });

    const [itens] = await db.query(
      `SELECT pi.*, p.titulo, p.condicao, img.url AS imagem
       FROM pedido_itens pi
       JOIN produtos p ON p.id = pi.produto_id
       LEFT JOIN produto_imagens img ON img.produto_id = p.id AND img.principal = 1
       WHERE pi.pedido_id = ?`,
      [req.params.id]
    );
    res.json({ ...pedido[0], itens });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/pedidos/:id/status  – atualizar status (simulação)
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['aguardando_pagamento', 'pago', 'enviado', 'entregue', 'cancelado'];
  if (!statusValidos.includes(status)) return res.status(400).json({ erro: 'Status inválido' });

  try {
    await db.query('UPDATE pedidos SET status=?, atualizado_em=NOW() WHERE id=? AND comprador_id=?',
      [status, req.params.id, req.usuario.id]);
    res.json({ mensagem: 'Status atualizado!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;