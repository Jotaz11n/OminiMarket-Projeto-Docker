import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; // <--- IMPORTADO O useLocation
import api from '../services/api';
import ProdutoCard from '../components/ProdutoCard';

const categorias = [
  { nome: 'Eletrônicos', icone: '💻', slug: 'eletronicos' },
  { nome: 'Moda', icone: '👗', slug: 'moda' },
  { nome: 'Casa', icone: '🏠', slug: 'casa-jardim' },
  { nome: 'Esportes', icone: '⚽', slug: 'esportes' },
  { nome: 'Livros', icone: '📚', slug: 'livros' },
  { nome: 'Beleza', icone: '💄', slug: 'beleza' },
  { nome: 'Autos', icone: '🚗', slug: 'automoveis' },
  { nome: 'Brinquedos', icone: '🧸', slug: 'brinquedos' },
];

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Captura os parâmetros da URL (ex: ?busca=termo)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const termoBusca = queryParams.get('busca') || '';

  useEffect(() => {
    setLoading(true);
    
    // Se houver um termo de busca, pesquisamos por ele. Caso contrário, traz os mais vendidos.
    const url = termoBusca 
      ? `/produtos?busca=${encodeURIComponent(termoBusca)}`
      : '/produtos?limite=8&ordem=mais_vendidos';

    api.get(url)
      .then(({ data }) => {
        // Ajuste defensivo: lida caso seu backend mude a estrutura da resposta entre as duas rotas
        if (data.produtos) {
          setProdutos(data.produtos);
        } else {
          setProdutos(data);
        }
      })
      .catch(() => { setProdutos([]); })
      .finally(() => setLoading(false));
  }, [termoBusca]); // <--- O useEffect roda toda vez que o usuário pesquisa algo novo!

  return (
    <main style={{ paddingBottom: 40 }} className="container">
      {/* Banner Principal OmniMarket */}
      <div style={styles.banner}>
        <img
          src="/logo.png"
          alt="OmniMarket Logo"
          style={{ height: '90px', marginBottom: '16px' }}
        />
        <h1 style={styles.bannerH1}>
          Bem-vindo ao OmniMarket!
        </h1>
        <p style={styles.bannerSub}>
          Encontre os melhores produtos com entregas a jato para todo o Brasil.
        </p>
        <Link to="/produtos" className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px', boxShadow: '0 4px 12px rgba(255,107,0,0.3)' }}>
          Ver todos os produtos →
        </Link>
      </div>

      {/* Categorias */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Categorias em Destaque</h2>
        <div style={styles.catGrid}>
          {categorias.map(c => (
            <Link key={c.slug} to={`/produtos?busca=${c.nome}`} style={styles.catItem}>
              <span style={styles.catIcon}>{c.icone}</span>
              <span style={styles.catNome}>{c.nome}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Produtos em Destaque ou Resultados da Busca */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            {termoBusca ? `🔍 Resultados para: "${termoBusca}"` : '🔥 Mais Vendidos'}
          </h2>
          <Link to="/produtos" style={styles.verTodos}>Ver todos</Link>
        </div>
        {loading ? (
          <div className="spinner" style={{ margin: '30px auto', display: 'block' }} />
        ) : produtos.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--texto-suave)', padding: '20px' }}>
            Nenhum produto encontrado para sua busca.
          </p>
        ) : (
          <div style={styles.grid}>
            {produtos.map(p => <ProdutoCard key={p.id} produto={p} />)}
          </div>
        )}
      </section>

      {/* Banner Informativo de Diferenciais */}
      <section style={styles.infoBanner}>
        <div style={styles.infoItem}><span style={styles.infoIcon}>🚚</span><div><strong>Frete Grátis</strong><p style={{color: 'var(--texto-suave)', fontSize: 13}}>Em milhares de produtos</p></div></div>
        <div style={styles.infoItem}><span style={styles.infoIcon}>🔒</span><div><strong>Compra Segura</strong><p style={{color: 'var(--texto-suave)', fontSize: 13}}>Seus dados 100% protegidos</p></div></div>
        <div style={styles.infoItem}><span style={styles.infoIcon}>↩️</span><div><strong>Devolução Fácil</strong><p style={{color: 'var(--texto-suave)', fontSize: 13}}>Até 30 dias regulamentares</p></div></div>
        <div style={styles.infoItem}><span style={styles.infoIcon}>💳</span><div><strong>Pagamento Flexível</strong><p style={{color: 'var(--texto-suave)', fontSize: 13}}>PIX, Cartão ou Boleto</p></div></div>
      </section>
    </main>
  );
}

const styles = {
  banner: {
    backgroundColor: 'var(--azul)',
    color: '#FFFFFF',
    padding: '50px 20px',
    borderRadius: 'var(--radius)',
    marginTop: '24px',
    marginBottom: '40px',
    textAlign: 'center',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  bannerH1: { fontSize: '36px', fontWeight: '800', fontFamily: "'Sora', sans-serif", marginBottom: '12px' },
  bannerSub: { fontSize: '18px', marginBottom: '28px', color: '#E6F0FF', fontWeight: '500' },
  section: { marginTop: 40 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: '22px', fontWeight: 700, fontFamily: "'Sora', sans-serif", color: 'var(--texto)' },
  verTodos: { color: 'var(--azul)', fontWeight: '700', fontSize: '15px', transition: 'color 0.2s' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 },
  catItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'var(--cinza-card)', borderRadius: 'var(--radius)', padding: '20px 10px', boxShadow: 'var(--sombra)', transition: 'all .2s', cursor: 'pointer', textDecoration: 'none' },
  catIcon: { fontSize: 36 },
  catNome: { fontSize: 13, fontWeight: 700, textAlign: 'center', color: 'var(--texto)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
  infoBanner: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24, background: 'var(--cinza-card)', borderRadius: 'var(--radius)', padding: 24, marginTop: 48, boxShadow: 'var(--sombra)' },
  infoItem: { display: 'flex', alignItems: 'center', gap: 14 },
  infoIcon: { fontSize: 32 },
};
