import React from 'react';
import { Link } from 'react-router-dom';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ProdutoCard({ produto }) {
  const { adicionarItem } = useCarrinho();
  const { usuario }       = useAuth();

  const desconto = produto.preco_original
    ? Math.round((1 - produto.preco / produto.preco_original) * 100)
    : null;

  const handleCarrinho = async (e) => {
    e.preventDefault(); // Evita que o clique no botão abra a página do produto
    if (!usuario) { 
      toast.error('Faça login para adicionar ao carrinho'); 
      return; 
    }
    try {
      await adicionarItem(produto.id);
      toast.success('Adicionado ao carrinho! 🛒');
    } catch {
      toast.error('Erro ao adicionar');
    }
  };

  return (
    <Link to={`/produtos/${produto.id}`} style={styles.card} className="product-card">
      {/* Container da Imagem */}
      <div style={styles.imgWrap}>
        <img
          src={produto.imagem_principal || produto.imagem || `https://picsum.photos/seed/${produto.id}/300/300`}
          alt={produto.titulo}
          style={styles.img}
          onError={(e) => { e.target.src = `https://picsum.photos/seed/${produto.id+100}/300/300`; }}
        />
        {desconto && <span style={styles.desconto}>{desconto}% OFF</span>}
      </div>

      {/* Bloco de Informações */}
      <div style={styles.info}>
        <p style={styles.titulo}>{produto.titulo}</p>

        {/* Alinhamento uniforme dos preços */}
        <div style={styles.precoWrapper}>
          {produto.preco_original ? (
            <p style={styles.precoOrig}>{fmt(produto.preco_original)}</p>
          ) : (
            <p style={{ ...styles.precoOrig, visibility: 'hidden' }}>-</p> // Reserva espaço vertical
          )}
          <p style={styles.preco}>{fmt(produto.preco)}</p>
        </div>

        {/* Badge de Frete */}
        {produto.frete_gratis ? (
          <span className="badge-verde" style={styles.badge}>⚡ Frete grátis</span>
        ) : (
          <span style={{ fontSize: '12px', color: 'transparent', margin: '2px 0' }}>-</span>
        )}

        {/* Ação Principal */}
        <button onClick={handleCarrinho} style={styles.btnCart}>
          Adicionar ao Carrinho
        </button>
      </div>
    </Link>
  );
}

const styles = {
  card: { 
    display: 'flex', 
    flexDirection: 'column', 
    background: 'var(--cinza-card)', 
    borderRadius: 'var(--radius)', 
    overflow: 'hidden', 
    boxShadow: 'var(--sombra)', 
    transition: 'transform .2s, box-shadow .2s', 
    cursor: 'pointer', 
    color: 'var(--texto)',
    textDecoration: 'none',
    height: '100%' 
  },
  imgWrap: { 
    position: 'relative', 
    background: '#ffffff', 
    borderBottom: '1px solid var(--borda)',
    width: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  img: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'contain', 
    display: 'block',
    padding: '12px'
  },
  desconto: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    background: 'var(--verde)', 
    color: '#fff', 
    fontSize: '11px', 
    fontWeight: 700, 
    padding: '3px 6px', 
    borderRadius: 4 
  },
  info: { 
    padding: '14px', 
    display: 'flex', 
    flexDirection: 'column', 
    flex: 1 
  },
  titulo: { 
    fontSize: '13px', 
    lineHeight: '1.4', 
    color: 'var(--texto-suave)',
    display: '-webkit-box', 
    WebkitLineClamp: 2, 
    WebkitBoxOrient: 'vertical', 
    overflow: 'hidden',
    height: '36px', // Fixa o tamanho para 2 linhas de texto
    marginBottom: '8px'
  },
  precoWrapper: {
    marginTop: 'auto', // Empurra a seção financeira para o fundo do bloco de texto
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  precoOrig: { 
    fontSize: '12px', 
    color: 'var(--texto-claro)', 
    textDecoration: 'line-through',
    margin: 0
  },
  preco: { 
    fontSize: '20px', 
    fontWeight: '800', 
    color: 'var(--texto)',
    lineHeight: '1.2'
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: '6px',
    marginBottom: '12px'
  },
  btnCart: { 
    width: '100%',
    background: 'var(--laranja)', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '6px', 
    padding: '10px 0', 
    fontWeight: 700, 
    fontSize: '13px', 
    cursor: 'pointer', 
    transition: 'background .2s',
    boxShadow: '0 2px 4px rgba(255,107,0,0.1)'
  },
};