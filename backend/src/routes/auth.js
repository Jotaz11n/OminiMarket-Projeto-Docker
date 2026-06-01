const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/database');
const router   = express.Router();

// POST /api/auth/registrar
router.post('/registrar', async (req, res) => {
  const { nome, email, senha, cpf, telefone } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
  }
  try {
    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length > 0) return res.status(409).json({ erro: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, cpf, telefone) VALUES (?, ?, ?, ?, ?)',
      [nome, email, hash, cpf || null, telefone || null]
    );
    
    // Novo usuário padrão sempre nasce com is_admin: 0 (ou false)
    const token = jwt.sign(
      { id: result.insertId, nome, email, is_admin: 0 }, 
      process.env.JWT_SECRET || 'segredo_academico',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      mensagem: 'Usuário criado com sucesso', 
      token, 
      usuario: { id: result.insertId, nome, email, is_admin: 0 } 
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar usuário', detalhe: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) return res.status(401).json({ erro: 'Credenciais inválidas' });

    // 🌟 AQUI ESTÁ A MÁGICA: Incluímos o is_admin dentro do Token JWT
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, is_admin: usuario.is_admin },
      process.env.JWT_SECRET || 'segredo_academico',
      { expiresIn: '7d' }
    );
    
    // 🌟 E também mandamos o is_admin direto para o React ler na hora
    res.json({
      token,
      usuario: { 
        id: usuario.id, 
        nome: usuario.nome, 
        email: usuario.email, 
        reputacao: usuario.reputacao, 
        avatar_url: usuario.avatar_url,
        is_admin: usuario.is_admin 
      }
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro no login', detalhe: err.message });
  }
});

module.exports = router;