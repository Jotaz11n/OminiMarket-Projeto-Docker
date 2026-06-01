import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const handleBusca = (e) => {
    e.preventDefault();
    if (busca.trim()) {
      navigate(`/?busca=${busca}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div className="container" style={styles.container}>

        {/* Logo OmniMarket */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/logo.png"
            alt="OmniMarket"
            style={{ height: '45px', objectFit: 'contain' }}
          />
        </Link>

        {/* Barra de Busca */}
        <form onSubmit={handleBusca} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Buscar produtos, marcas e muito mais..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            🔍
          </button>
        </form>

        {/* Menu do Usuário */}
        <nav style={styles.nav}>
          {usuario ? (
            <div style={styles.userMenu}>
              <Link to="/perfil" style={styles.navLink}>
                👤 Olá, {usuario.nome?.split(' ')[0]}
              </Link>
              
              <Link to="/pedidos" style={styles.navLink}>
                📦 Meus Pedidos
              </Link>
              
              {/* NOVA OPÇÃO DE ENDEREÇOS ADICIONADA AQUI */}
              <Link to="/enderecos" style={styles.navLink}>
                📍 Meus Endereços
              </Link>
              
              {/* ÍCONE DO CARRINHO PARA USUÁRIO LOGADO */}
              <Link to="/carrinho" style={styles.navLink}>
                🛒 Carrinho
              </Link>

              <button onClick={handleLogout} style={styles.logoutBtn}>
                Sair
              </button>
            </div>
          ) : (
            <div style={styles.userMenu}>
              <Link to="/login" style={styles.navLink}>Entre</Link>
              <Link to="/cadastro" style={styles.navLink}>Cadastre-se</Link>
              
              {/* ÍCONE DO CARRINHO PARA VISITANTE */}
              <Link to="/carrinho" style={styles.navLink}>
                🛒 Carrinho
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: 'var(--cinza-card)',
    borderBottom: '1px solid var(--borda)',
    padding: '12px 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: 'var(--sombra)',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--texto)',
    fontFamily: "'Sora', sans-serif",
    letterSpacing: '-0.5px',
  },
  logoHighlight: {
    color: 'var(--laranja)',
  },
  searchForm: {
    flex: 1,
    maxWidth: '600px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--cinza-bg)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    border: '1px solid transparent',
    transition: 'border 0.2s',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '12px 16px',
    outline: 'none',
    fontSize: '14px',
    color: 'var(--texto)',
  },
  searchButton: {
    backgroundColor: 'transparent',
    padding: '0 16px',
    fontSize: '16px',
    color: 'var(--texto-suave)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--texto)',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
  },
  logoutBtn: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--texto-suave)',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
};