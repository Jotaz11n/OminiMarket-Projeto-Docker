const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');
const router  = express.Router();

// 1. Cadastrar um novo endereço para o usuário logado
router.post('/', auth, async (req, res) => {
  const { rua, numero, bairro, cidade, estado, cep } = req.body;
  const usuario_id = req.usuario.id;

  if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO enderecos (usuario_id, rua, numero, bairro, cidade, estado, cep) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, rua, numero, bairro, cidade, estado, cep]
    );
    res.status(201).json({ message: 'Endereço cadastrado com sucesso!', id: result.insertId });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao salvar endereço', detalhe: error.message });
  }
});

// 2. Listar todos os endereços do usuário logado
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM enderecos WHERE usuario_id = ?', [req.usuario.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar endereços' });
  }
});

// 3. Deletar um endereço
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM enderecos WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    res.json({ message: 'Endereço removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover endereço' });
  }
});

// 4. Calcular Frete baseado na UF (Regra: SP é Grátis, outros estados R$ 25,00)
router.post('/calcular-frete', async (req, res) => {
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ erro: 'Estado é obrigatório para o frete.' });
  }

  const uf = estado.toUpperCase().trim();
  
  // Regra de negócio solicitada
  const valorFrete = uf === 'SP' ? 0.00 : 25.00;
  const prazo = uf === 'SP' ? 2 : 6; // Prazo fictício em dias

  res.json({ valorFrete, prazo });
});

module.exports = router;