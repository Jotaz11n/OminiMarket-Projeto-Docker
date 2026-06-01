const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/carrinho  – listar itens do carrinho
router.get('/', auth, async (req, res) => {
  try {
    const [itens] = await db.query(
      `SELECT c.id, c.quantidade, c.adicionado_em,
              p.id AS produto_id, p.titulo, p.preco, p.estoque, p.frete_gratis,
              pi.url AS imagem
       FROM carrinho c
       JOIN produtos p ON p.id = c.produto_id
       LEFT JOIN produto_imagens pi ON pi.produto_id = p.id AND pi.principal = 1
       WHERE c.usuario_id = ?`,
      [req.usuario.id]
    );
    const total = itens.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    res.json({ itens, total: parseFloat(total.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/carrinho  – adicionar item
router.post('/', auth, async (req, res) => {
  const { produto_id, quantidade = 1 } = req.body;
  if (!produto_id) return res.status(400).json({ erro: 'produto_id é obrigatório' });
  try {
    const [prod] = await db.query("SELECT id, estoque FROM produtos WHERE id=? AND status='ativo'", [produto_id]);
    if (prod.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    if (prod[0].estoque < quantidade) return res.status(400).json({ erro: 'Estoque insuficiente' });

    await db.query(
      `INSERT INTO carrinho (usuario_id, produto_id, quantidade)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)`,
      [req.usuario.id, produto_id, quantidade]
    );
    res.status(201).json({ mensagem: 'Item adicionado ao carrinho!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/carrinho/:id  – atualizar quantidade
router.put('/:id', auth, async (req, res) => {
  const { quantidade } = req.body;
  if (!quantidade || quantidade < 1) return res.status(400).json({ erro: 'Quantidade inválida' });
  try {
    await db.query(
      'UPDATE carrinho SET quantidade=? WHERE id=? AND usuario_id=?',
      [quantidade, req.params.id, req.usuario.id]
    );
    res.json({ mensagem: 'Quantidade atualizada!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/carrinho/:id  – remover item
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM carrinho WHERE id=? AND usuario_id=?', [req.params.id, req.usuario.id]);
    res.json({ mensagem: 'Item removido do carrinho!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/carrinho  – limpar carrinho
router.delete('/', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM carrinho WHERE usuario_id=?', [req.usuario.id]);
    res.json({ mensagem: 'Carrinho limpo!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
