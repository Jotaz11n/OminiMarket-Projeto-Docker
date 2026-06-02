import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ProdutoDetalhe() {
  const { id }                = useParams();
  const navigate              = useNavigate();
  const { adicionarItem }     = useCarrinho();
  const { usuario }           = useAuth();
  const [produto, setProduto] = useState(null);
  const [imgIdx, setImgIdx]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [qtd, setQtd]         = useState(1);

  useEffect(() => {
    api.get(`/produtos/${id}`)
      .then(({ data }) => setProduto(data))
      .catch(() => toast.error('Produto não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleComprar = async () => {
    if (!usuario) { toast.error('Faça login para comprar'); navigate('/login'); return; }
    await adicionarItem(produto.id, qtd);
    navigate('/carrinho');
  };

  const handleCarrinho = async () => {
    if (!usuario) { toast.error('Faça login'); navigate('/login'); return; }
    await adicionarItem(produto.id, qtd);
  };

  if (loading) return <div className="spinner" />;
  if (!produto) return <div style={{ padding: 40, textAlign: 'center' }}>Produto não encontrado.</div>;

  const imagens = produto.imagens?.length > 0
    ? produto.imagens
    : [{ url: `https://picsum.photos/seed/${produto.id}/600/600` }];

  const desconto = produto.preco_original
    ? Math.round((1 - produto.preco / produto.preco_original) * 100)
    : null;

  const estrelas = (nota) => '⭐'.repeat(Math.round(nota));

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div style={styles.breadcrumb}>
        <a href="/" style={styles.bcLink}>Início</a> &rsaquo;
        <a href="/produtos" style={styles.bcLink}> Produtos</a> &rsaquo;
        <span> {produto.titulo}</span>
      </div>

      <div style={styles.layout}>
        {/* Galeria */}
        <div style={styles.galeria}>
          <img
            src={imagens[imgIdx]?.url}
            alt={produto.titulo}
            style={styles.imgPrincipal}
            onError={(e) => { e.target.src = `https://picsum.photos/seed/${produto.id+50}/600/600`; }}
          />
          <div style={styles.thumbsRow}>
            {imagens.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt=""
                style={{ ...styles.thumb, ...(i === imgIdx ? styles.thumbAtivo : {}) }}
                onClick={() => setImgIdx(i)}
                onError={(e) => { e.target.src = `https://picsum.photos/seed/${produto.id+i}/80/80`; }}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={styles.info}>
          {produto.condicao === 'novo' && <span style={styles.tagNovo}>Novo</span>}
          <h1 style={styles.titulo}>{produto.titulo}</h1>

          <div style={styles.precoArea}>
            {produto.preco_original && (
              <p style={styles.precoOrig}>{fmt(produto.preco_original)}</p>
            )}
            <div style={styles.precoRow}>
              <span style={styles.preco}>{fmt(produto.preco)}</span>
              {desconto && <span style={styles.desconto}>{desconto}% OFF</span>}
            </div>
          </div>

          {produto.frete_gratis && (
            <p style={styles.frete}>🚚 Frete grátis</p>
          )}

          <div style={styles.qtdRow}>
            <label style={styles.qtdLabel}>Quantidade:</label>
            <div style={styles.qtdCtrl}>
              <button onClick={() => setQtd(q => Math.max(1, q-1))} style={styles.qtdBtn}>−</button>
              <span style={styles.qtdVal}>{qtd}</span>
              <button onClick={() => setQtd(q => Math.min(produto.estoque, q+1))} style={styles.qtdBtn}>+</button>
            </div>
            <span style={styles.estoque}>{produto.estoque} disponíveis</span>
          </div>

          <button onClick={handleComprar}  style={styles.btnComprar}>Comprar agora</button>
          <button onClick={handleCarrinho} style={styles.btnCarrinho}>Adicionar ao carrinho</button>

          <div style={styles.vendedor}>
            <p style={styles.vendedorLabel}>Vendido por</p>
            <p style={styles.vendedorNome}>{produto.vendedor_nome}</p>
            <p style={{ color: '#f5a623' }}>{'⭐'.repeat(Math.round(produto.vendedor_reputacao || 5))} {produto.vendedor_reputacao}</p>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div style={styles.descricaoBox}>
        <h2 style={styles.secTitle}>Descrição do produto</h2>
        <p style={{ lineHeight: 1.7, color: '#444' }}>{produto.descricao || 'Sem descrição disponível.'}</p>
      </div>

      {/* Avaliações */}
      {produto.avaliacoes?.length > 0 && (
        <div style={styles.avaliacoesBox}>
          <h2 style={styles.secTitle}>Avaliações dos compradores</h2>
          {produto.avaliacoes.map(av => (
            <div key={av.id} style={styles.avItem}>
              <div style={styles.avHeader}>
                <strong>{av.usuario_nome}</strong>
                <span style={{ color: '#f5a623' }}>{estrelas(av.nota)}</span>
              </div>
              <p style={{ color: '#555', fontSize: 14 }}>{av.comentario}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  breadcrumb:   { fontSize: 13, color: '#666', marginBottom: 16 },
  bcLink:       { color: '#3483FA' },
  layout:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  galeria:      { display: 'flex', flexDirection: 'column', gap: 12 },
  imgPrincipal: { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' },
  thumbsRow:    { display: 'flex', gap: 8 },
  thumb:        { width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '2px solid #eee', cursor: 'pointer' },
  thumbAtivo:   { borderColor: '#3483FA' },
  info:         { display: 'flex', flexDirection: 'column', gap: 12 },
  tagNovo:      { display: 'inline-block', fontSize: 12, color: '#666', borderBottom: '1px solid #eee', paddingBottom: 4 },
  titulo:       { fontSize: 22, fontWeight: 700, lineHeight: 1.3 },
  precoArea:    { marginTop: 8 },
  precoOrig:    { fontSize: 14, color: '#999', textDecoration: 'line-through' },
  precoRow:     { display: 'flex', alignItems: 'center', gap: 12 },
  preco:        { fontSize: 32, fontWeight: 800 },
  desconto:     { background: '#00A650', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 14, fontWeight: 700 },
  frete:        { color: '#00A650', fontWeight: 700, fontSize: 15 },
  qtdRow:       { display: 'flex', alignItems: 'center', gap: 12 },
  qtdLabel:     { fontWeight: 600, fontSize: 14 },
  qtdCtrl:      { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' },
  qtdBtn:       { padding: '6px 14px', background: '#f5f5f5', fontSize: 18, cursor: 'pointer', border: 'none' },
  qtdVal:       { padding: '0 16px', fontWeight: 700, fontSize: 16 },
  estoque:      { color: '#999', fontSize: 13 },
  btnComprar:   { background: '#FFE600', color: '#333', border: 'none', borderRadius: 8, padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer' },
  btnCarrinho:  { background: '#fff', color: '#3483FA', border: '2px solid #3483FA', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer' },
  vendedor:     { background: '#f8f8f8', borderRadius: 8, padding: 16, marginTop: 8 },
  vendedorLabel:{ fontSize: 12, color: '#999', marginBottom: 4 },
  vendedorNome: { fontWeight: 700 },
  descricaoBox: { background: '#fff', borderRadius: 8, padding: 24, marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  avaliacoesBox:{ background: '#fff', borderRadius: 8, padding: 24, marginTop: 16, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  secTitle:     { fontSize: 20, fontWeight: 700, marginBottom: 16 },
  avItem:       { borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 },
  avHeader:     { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
};
