const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/produtos  – listagem com busca e filtros
router.get('/', async (req, res) => {
  const { busca, categoria_id, condicao, preco_min, preco_max, frete_gratis, ordem, pagina = 1, limite = 12 } = req.query;
  const offset = (parseInt(pagina) - 1) * parseInt(limite);

  let where  = ["p.status = 'ativo'"];
  let params = [];

  if (busca)        { where.push('p.titulo LIKE ?');       params.push(`%${busca}%`); }
  if (categoria_id) { where.push('p.categoria_id = ?');   params.push(categoria_id); }
  if (condicao)     { where.push('p.condicao = ?');        params.push(condicao); }
  if (preco_min)    { where.push('p.preco >= ?');         params.push(preco_min); }
  if (preco_max)    { where.push('p.preco <= ?');         params.push(preco_max); }
  if (frete_gratis === 'true') { where.push('p.frete_gratis = 1'); }

  const ordenacoes = {
    preco_asc:  'p.preco ASC',
    preco_desc: 'p.preco DESC',
    mais_vendidos: 'p.total_vendas DESC',
    recentes: 'p.criado_em DESC',
  };
  const orderBy = ordenacoes[ordem] || 'p.criado_em DESC';

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const [total] = await db.query(
      `SELECT COUNT(*) as total FROM produtos p ${whereStr}`, params
    );
    const [produtos] = await db.query(
      `SELECT p.*, u.nome AS vendedor_nome, c.nome AS categoria_nome,
              pi.url AS imagem_principal
       FROM produtos p
       LEFT JOIN usuarios u ON u.id = p.vendedor_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN produto_imagens pi ON pi.produto_id = p.id AND pi.principal = 1
       ${whereStr}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limite), offset]
    );
    res.json({ produtos, total: total[0].total, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar produtos', detalhe: err.message });
  }
});

// GET /api/produtos/:id  – detalhe do produto
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.nome AS vendedor_nome, u.reputacao AS vendedor_reputacao,
              c.nome AS categoria_nome
       FROM produtos p
       LEFT JOIN usuarios u ON u.id = p.vendedor_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });

    const [imagens] = await db.query(
      'SELECT * FROM produto_imagens WHERE produto_id = ? ORDER BY ordem', [req.params.id]
    );
    const [avaliacoes] = await db.query(
      `SELECT a.*, u.nome AS usuario_nome FROM avaliacoes a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.produto_id = ? ORDER BY a.criado_em DESC LIMIT 5`,
      [req.params.id]
    );
    res.json({ ...rows[0], imagens, avaliacoes });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar produto', detalhe: err.message });
  }
});

// POST /api/produtos  – criar produto (autenticado)
router.post('/', auth, async (req, res) => {
  const { titulo, descricao, preco, preco_original, estoque, categoria_id, condicao, frete_gratis, imagens } = req.body;
  if (!titulo || !preco || !estoque) {
    return res.status(400).json({ erro: 'Título, preço e estoque são obrigatórios' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO produtos (titulo, descricao, preco, preco_original, estoque, categoria_id, vendedor_id, condicao, frete_gratis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao, preco, preco_original || null, estoque, categoria_id || null,
       req.usuario.id, condicao || 'novo', frete_gratis ? 1 : 0]
    );
    if (imagens && imagens.length > 0) {
      const imgValues = imagens.map((url, i) => [result.insertId, url, i === 0, i]);
      await db.query('INSERT INTO produto_imagens (produto_id, url, principal, ordem) VALUES ?', [imgValues]);
    }
    res.status(201).json({ mensagem: 'Produto criado com sucesso no Omini Market!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar produto', detalhe: err.message });
  }
});

// PUT /api/produtos/:id  – atualizar produto (Dono ou Admin)
router.put('/:id', auth, async (req, res) => {
  const { titulo, descricao, preco, estoque, status } = req.body;
  try {
    const [rows] = await db.query('SELECT vendedor_id FROM produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    
    // Regra Omini Market: Dono do produto ou Admin podem alterar
    const ehDono = rows[0].vendedor_id === req.usuario.id;
    const ehAdmin = req.usuario.is_admin === 1 || req.usuario.is_admin === true;

    if (!ehDono && !ehAdmin) {
      return res.status(403).json({ erro: 'Você não tem permissão para editar este produto' });
    }

    await db.query(
      'UPDATE produtos SET titulo=?, descricao=?, preco=?, estoque=?, status=?, atualizado_em=NOW() WHERE id=?',
      [titulo, descricao, preco, estoque, status || 'ativo', req.params.id]
    );
    res.json({ mensagem: 'Anúncio atualizado com sucesso no Omini Market!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar produto', detalhe: err.message });
  }
});

// DELETE /api/produtos/:id  – remover produto (Dono ou Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT vendedor_id FROM produtos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    
    const ehDono = rows[0].vendedor_id === req.usuario.id;
    const ehAdmin = req.usuario.is_admin === 1 || req.usuario.is_admin === true;

    if (!ehDono && !ehAdmin) {
      return res.status(403).json({ erro: 'Você não tem permissão para remover este produto' });
    }

    await db.query("UPDATE produtos SET status='removido' WHERE id=?", [req.params.id]);
    res.json({ mensagem: 'Produto removido do Omini Market!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover produto', detalhe: err.message });
  }
});

// POST /api/produtos/:id/favoritar  – favoritar
router.post('/:id/favoritar', auth, async (req, res) => {
  try {
    await db.query(
      'INSERT IGNORE INTO favoritos (usuario_id, produto_id) VALUES (?, ?)',
      [req.usuario.id, req.params.id]
    );
    res.json({ mensagem: 'Adicionado aos favoritos!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao favoritar', detalhe: err.message });
  }
});

// DELETE /api/produtos/:id/favoritar  – desfavoritar
router.delete('/:id/favoritar', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM favoritos WHERE usuario_id=? AND produto_id=?', [req.usuario.id, req.params.id]);
    res.json({ mensagem: 'Removido dos favoritos!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;