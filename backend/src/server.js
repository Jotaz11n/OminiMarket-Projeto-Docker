process.on('uncaughtException', (err) => {
  console.error('🔥 ERRO FATAL (uncaughtException):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 ERRO FATAL (unhandledRejection):', reason);
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const produtoRoutes = require('./routes/produtos');
const carrinhoRoutes = require('./routes/carrinho');
const pedidoRoutes = require('./routes/pedidos');
const categoriaRoutes = require('./routes/categorias');
const usuarioRoutes = require('./routes/usuarios');
const adminRoutes = require('./routes/admin');
const enderecoRoutes = require('./routes/enderecos'); // Rota adicionada

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rotas ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/carrinho', carrinhoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/endereco', enderecoRoutes); // Rota ativada

// Health-check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API MercadoLivre Clone rodando!', timestamp: new Date() });
});

// Handler 404
app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Handler de erros globais
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor', detalhe: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health`);
});