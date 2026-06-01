const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/usuarios/perfil
router.get('/perfil', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nome, email, cpf, telefone, avatar_url, reputacao, criado_em FROM usuarios WHERE id=?',
      [req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/usuarios/perfil
router.put('/perfil', auth, async (req, res) => {
  const { nome, telefone, avatar_url } = req.body;
  try {
    await db.query(
      'UPDATE usuarios SET nome=?, telefone=?, avatar_url=?, atualizado_em=NOW() WHERE id=?',
      [nome, telefone, avatar_url, req.usuario.id]
    );
    res.json({ mensagem: 'Perfil atualizado!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/usuarios/favoritos
router.get('/favoritos', auth, async (req, res) => {
  try {
    const [favs] = await db.query(
      `SELECT p.*, pi.url AS imagem
       FROM favoritos f
       JOIN produtos p ON p.id = f.produto_id
       LEFT JOIN produto_imagens pi ON pi.produto_id = p.id AND pi.principal = 1
       WHERE f.usuario_id = ?`,
      [req.usuario.id]
    );
    res.json(favs);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/usuarios/meus-produtos
router.get('/meus-produtos', auth, async (req, res) => {
  try {
    const [produtos] = await db.query(
      `SELECT p.*, c.nome AS categoria_nome, pi.url AS imagem
       FROM produtos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN produto_imagens pi ON pi.produto_id = p.id AND pi.principal = 1
       WHERE p.vendedor_id = ? AND p.status != 'removido'
       ORDER BY p.criado_em DESC`,
      [req.usuario.id] // Garante que puxa o ID do usuário logado
    );

    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar seus produtos', detalhe: err.message });
  }
});

module.exports = router;
