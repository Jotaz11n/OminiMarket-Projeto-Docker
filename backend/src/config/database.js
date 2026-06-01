const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'mluser',
  password:           process.env.DB_PASSWORD || 'mlpass123',
  database:           process.env.DB_NAME     || 'mercadolivre',
  port:               parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
});

// Testa a conexão ao iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL conectado com sucesso!');
    conn.release();
  } catch (err) {
    console.error('❌ Erro ao conectar no MySQL:', err.message);
  }
})();

module.exports = pool;
