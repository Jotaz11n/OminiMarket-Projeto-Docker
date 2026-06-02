import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function Carrinho() {
  const { itens, total, loading, removerItem, atualizarQtd, fetchCarrinho } = useCarrinho();
  const { usuario } = useAuth();
  const navigate    = useNavigate();
  const [finalizando, setFinalizando] = useState(false);
  const [metodo, setMetodo] = useState('pix');

  const [enderecosSalvos, setEnderecosSalvos]           = useState([]);
  const [idEnderecoSelecionado, setIdEnderecoSelecionado] = useState('');
  const [frete, setFrete] = useState({ valor: 0, prazo: null, carregando: false });

  // ── Busca endereços salvos ──────────────────────────────────────────
  useEffect(() => {
    if (!usuario) return;
    api.get('/enderecos')
      .then(({ data }) => {
        setEnderecosSalvos(data);
        // Se tiver endereço principal, seleciona automaticamente e calcula frete
        const principal = data.find(e => e.principal);
        if (principal) {
          setIdEnderecoSelecionado(principal.id); // 🔥 ESSA É A LINHA QUE FALTAVA!
          calcularFrete(principal);
        }
      })
      .catch(() => toast.error('Erro ao carregar endereços de entrega.'));
  }, [usuario]);

  // ── Calcula frete via /api/frete/calcular ──────────────────────────
  // CORREÇÃO: usa a rota correta do backend de frete
  const calcularFrete = async (endereco) => {
    if (!endereco) return;
    setFrete({ valor: 0, prazo: null, carregando: true });

    // Calcula peso total dos itens que não têm frete grátis
    const itensPagos = itens.filter(i => !i.frete_gratis);
    if (itensPagos.length === 0) {
      setFrete({ valor: 0, prazo: 3, carregando: false, gratis: true });
      return;
    }

    try {
      // CORREÇÃO: usa /frete/calcular com query params corretos
      const cep = String(endereco.cep).replace(/\D/g, '');
      const { data } = await api.get(`/frete/calcular?cep_destino=${cep}&uf_origem=SP`);
      setFrete({
        valor:     data.valor,
        prazo:     data.prazo_dias,
        carregando: false,
        gratis:    false,
      });
    } catch {
      setFrete({ valor: 0, prazo: null, carregando: false });
      toast.error('Não foi possível calcular o frete deste endereço.');
    }
  };

  const lidarSelecaoEndereco = (id) => {
    setIdEnderecoSelecionado(id);
    if (!id) {
      setFrete({ valor: 0, prazo: null, carregando: false });
      return;
    }
    const enderecoEscolhido = enderecosSalvos.find(e => e.id === parseInt(id));
    if (enderecoEscolhido) calcularFrete(enderecoEscolhido);
  };

  if (!usuario) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ fontSize: 48 }}>🛒</p>
      <p style={{ fontSize: 18, marginTop: 12 }}>Faça login para ver seu carrinho</p>
      <Link to="/login" style={{ ...styles.btn, display: 'inline-block', marginTop: 20 }}>Entrar</Link>
    </div>
  );

  if (loading) return <div className="spinner" />;

  if (itens.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ fontSize: 64 }}>🛒</p>
      <p style={{ fontSize: 20, marginTop: 12, fontWeight: 700 }}>Seu carrinho está vazio</p>
      <Link to="/produtos" className="btn-primary" style={{ display: 'inline-block', marginTop: 20 }}>
        Continuar comprando
      </Link>
    </div>
  );

  const handleFinalizar = async () => {
    if (!idEnderecoSelecionado) {
      toast.error('Selecione um endereço de entrega primeiro!');
      return;
    }
    setFinalizando(true);
    try {
      const { data } = await api.post('/pedidos', {
        metodo_pagamento: metodo,
        endereco_id: parseInt(idEnderecoSelecionado),
      });
      toast.success(`Pedido #${data.pedido_id} realizado! 🎉`);
      fetchCarrinho();
      navigate('/pedidos');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao finalizar pedido');
    } finally {
      setFinalizando(false);
    }
  };

  const totalComFrete = total + (frete.gratis ? 0 : frete.valor);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <h1 style={styles.titulo}>Carrinho de compras</h1>
      <div style={styles.layout}>

        {/* ── Itens ── */}
        <div style={{ flex: 1 }}>
          {itens.map(item => (
            <div key={item.id} style={styles.card}>
              <img
                src={item.imagem || `https://picsum.photos/seed/${item.produto_id}/120/120`}
                alt={item.titulo}
                style={styles.img}
                onError={(e) => { e.target.src = `https://picsum.photos/seed/${item.produto_id + 10}/120/120`; }}
              />
              <div style={{ flex: 1 }}>
                <Link to={`/produtos/${item.produto_id}`} style={styles.itemTitulo}>{item.titulo}</Link>
                {item.frete_gratis && (
                  <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>Frete grátis</p>
                )}
                <div style={styles.qtdRow}>
                  <button onClick={() => item.quantidade > 1 ? atualizarQtd(item.id, item.quantidade - 1) : removerItem(item.id)} style={styles.qtdBtn}>−</button>
                  <span style={styles.qtdVal}>{item.quantidade}</span>
                  <button onClick={() => atualizarQtd(item.id, item.quantidade + 1)} style={styles.qtdBtn}>+</button>
                  <button onClick={() => removerItem(item.id)} style={styles.removerBtn}>🗑 Remover</button>
                </div>
              </div>
              <p style={styles.preco}>{fmt(item.preco * item.quantidade)}</p>
            </div>
          ))}

          {/* ── Endereço de entrega ── */}
          <div style={{ ...styles.card, flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>📍 Endereço de Entrega</h3>
            {enderecosSalvos.length === 0 ? (
              <div>
                <p style={{ color: '#DC2626', fontSize: 14, marginBottom: 8 }}>
                  Você não tem nenhum endereço cadastrado.
                </p>
                <Link to="/enderecos" style={{ color: '#FF6600', fontWeight: 700, fontSize: 14 }}>
                  ➕ Cadastrar endereço agora
                </Link>
              </div>
            ) : (
              <div>
                <select
                  value={idEnderecoSelecionado}
                  onChange={e => lidarSelecaoEndereco(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Selecione para onde enviar --</option>
                  {enderecosSalvos.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.apelido ? `${e.apelido} — ` : ''}{e.rua}, {e.numero} ({e.cidade}/{e.estado?.toUpperCase()})
                      {e.principal ? ' ⭐' : ''}
                    </option>
                  ))}
                </select>
                <p style={{ marginTop: 8, fontSize: 13, color: '#6B7280' }}>
                  <Link to="/enderecos" style={{ color: '#FF6600', fontWeight: 600 }}>
                    Gerenciar endereços
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Resumo ── */}
        <div style={styles.resumo}>
          <h2 style={styles.resumoTitulo}>Resumo</h2>

          <div style={styles.resumoLinha}>
            <span>Subtotal</span>
            <span>{fmt(total)}</span>
          </div>

          <div style={styles.resumoLinha}>
            <span>Frete</span>
            <span style={{ color: frete.gratis ? '#16A34A' : 'inherit', fontWeight: frete.gratis ? 700 : 'normal' }}>
              {frete.carregando
                ? 'Calculando...'
                : !idEnderecoSelecionado
                  ? 'Selecione o endereço'
                  : frete.gratis
                    ? 'Grátis 🎉'
                    : fmt(frete.valor)}
            </span>
          </div>

          {frete.prazo && !frete.carregando && idEnderecoSelecionado && (
            <p style={{ color: '#16A34A', fontSize: 12, textAlign: 'right', marginTop: -6, marginBottom: 8, fontWeight: 600 }}>
              Chega em até {frete.prazo} dia{frete.prazo !== 1 ? 's' : ''}
            </p>
          )}

          <div style={{ ...styles.resumoLinha, fontWeight: 800, fontSize: 18, borderTop: '2px solid #eee', paddingTop: 12, marginTop: 4 }}>
            <span>Total</span>
            <span style={{ color: '#FF6600' }}>{fmt(totalComFrete)}</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>Forma de pagamento</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)} style={styles.select}>
              <option value="pix">💚 PIX</option>
              <option value="cartao_credito">💳 Cartão de Crédito</option>
              <option value="boleto">🏦 Boleto Bancário</option>
            </select>
          </div>

          <button
            onClick={handleFinalizar}
            disabled={finalizando || frete.carregando || !idEnderecoSelecionado}
            style={{
              ...styles.btnFinalizar,
              background: (!idEnderecoSelecionado || frete.carregando) ? '#ccc' : '#FF6600',
              cursor: (!idEnderecoSelecionado || frete.carregando) ? 'not-allowed' : 'pointer',
              color: '#fff',
            }}
          >
            {finalizando ? 'Processando...' : '✅ Finalizar compra'}
          </button>

          <Link to="/produtos" style={styles.continuarLink}>← Continuar comprando</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  titulo:       { fontSize: 24, fontWeight: 800, marginBottom: 20 },
  layout:       { display: 'flex', gap: 24, alignItems: 'flex-start' },
  card:         { display: 'flex', gap: 16, background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,.08)', alignItems: 'center' },
  img:          { width: 100, height: 100, objectFit: 'cover', borderRadius: 8 },
  itemTitulo:   { fontWeight: 600, fontSize: 15, color: '#111', textDecoration: 'none' },
  qtdRow:       { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 },
  qtdBtn:       { padding: '4px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#F9FAFB', cursor: 'pointer', fontSize: 16 },
  qtdVal:       { fontWeight: 700, minWidth: 24, textAlign: 'center' },
  removerBtn:   { marginLeft: 8, background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' },
  preco:        { fontWeight: 800, fontSize: 18, whiteSpace: 'nowrap' },
  resumo:       { width: 290, background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.08)', position: 'sticky', top: 80, flexShrink: 0 },
  resumoTitulo: { fontSize: 18, fontWeight: 800, marginBottom: 16 },
  resumoLinha:  { display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 },
  label:        { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 },
  select:       { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none' },
  btnFinalizar: { width: '100%', border: 'none', borderRadius: 8, padding: '14px 0', fontWeight: 800, fontSize: 16, marginTop: 16 },
  continuarLink:{ display: 'block', textAlign: 'center', marginTop: 12, color: '#FF6600', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  btn:          { background: '#FF6600', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none' },
};
