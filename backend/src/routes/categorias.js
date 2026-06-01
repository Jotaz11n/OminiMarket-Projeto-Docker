const express = require('express');
const db      = require('../config/database');
const router  = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [cats] = await db.query('SELECT * FROM categorias ORDER BY nome');
    res.json(cats);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
