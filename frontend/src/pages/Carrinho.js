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

  // Estados para a lógica de Endereço Salvo e Frete
  const [enderecosSalvos, setEnderecosSalvos] = useState([]);
  const [idEnderecoSelecionado, setIdEnderecoSelecionado] = useState('');
  const [frete, setFrete] = useState({ valor: 0, prazo: null, carregando: false });

  // 1. Busca os endereços que o usuário tem cadastrados assim que entra na tela
  useEffect(() => {
    if (usuario) {
      api.get('/endereco')
        .then(({ data }) => setEnderecosSalvos(data))
        .catch(() => toast.error('Erro ao carregar endereços de entrega.'));
    }
  }, [usuario]);

  // 2. Sempre que selecionar um endereço diferente na lista, recalcula o frete
  const lidarSelecaoEndereco = async (id) => {
    setIdEnderecoSelecionado(id);
    if (!id) {
      setFrete({ valor: 0, prazo: null, carregando: false });
      return;
    }

    setFrete({ valor: 0, prazo: null, carregando: true });
    const enderecoEscolhido = enderecosSalvos.find(e => e.id === parseInt(id));

    if (enderecoEscolhido) {
      try {
        const { data } = await api.post('/endereco/calcular-frete', { estado: enderecoEscolhido.estado });
        setFrete({
          valor: parseFloat(data.valorFrete),
          prazo: data.prazo,
          carregando: false
        });
      } catch {
        setFrete({ valor: 0, prazo: null, carregando: false });
        toast.error('Erro ao calcular frete deste endereço.');
      }
    }
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
    // REGRA DE NEGÓCIO: Bloqueia a compra na interface se não houver endereço selecionado
    if (!idEnderecoSelecionado) {
      toast.error('Selecione ou cadastre um endereço de entrega primeiro!');
      return;
    }

    setFinalizando(true);
    try {
      const { data } = await api.post('/pedidos', { 
        metodo_pagamento: metodo,
        endereco_id: parseInt(idEnderecoSelecionado)
      });
      toast.success(`Pedido #${data.pedido_id} realizado com sucesso! 🎉`);
      fetchCarrinho();
      navigate('/pedidos');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao finalizar pedido');
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <h1 style={styles.titulo}>Carrinho de compras</h1>
      <div style={styles.layout}>
        
        {/* Itens */}
        <div style={{ flex: 1 }}>
          {itens.map(item => (
            <div key={item.id} style={styles.card}>
              <img
                src={item.imagem || `https://picsum.photos/seed/${item.produto_id}/120/120`}
                alt={item.titulo}
                style={styles.img}
                onError={(e) => { e.target.src = `https://picsum.photos/seed/${item.produto_id+10}/120/120`; }}
              />
              <div style={{ flex: 1 }}>
                <Link to={`/produtos/${item.produto_id}`} style={styles.itemTitulo}>{item.titulo}</Link>
                <div style={styles.qtdRow}>
                  <button onClick={() => item.quantidade > 1 ? atualizarQtd(item.id, item.quantidade-1) : removerItem(item.id)} style={styles.qtdBtn}>−</button>
                  <span style={styles.qtdVal}>{item.quantidade}</span>
                  <button onClick={() => atualizarQtd(item.id, item.quantidade+1)} style={styles.qtdBtn}>+</button>
                  <button onClick={() => removerItem(item.id)} style={styles.removerBtn}>🗑 Remover</button>
                </div>
              </div>
              <p style={styles.preco}>{fmt(item.preco * item.quantidade)}</p>
            </div>
          ))}

          {/* Área de Seleção de Endereço */}
          <div style={{ ...styles.card, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>📍 Endereço de Entrega</h3>
            {enderecosSalvos.length === 0 ? (
              <div style={{ padding: '8px 0' }}>
                <p style={{ color: '#ff4d4d', fontSize: '14px', marginBottom: '8px' }}>Você não tem nenhum endereço cadastrado.</p>
                <Link to="/enderecos" style={{ color: '#3483FA', fontWeight: '600', textDecoration: 'none', fontSize: '14px' }}>➕ Cadastrar endereço agora</Link>
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
                      {e.rua}, {e.numero} ({e.cidade}/{e.estado.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p style={{ marginTop: '8px', fontSize: '13px' }}>
                  Não quer enviar para esses? <Link to="/enderecos" style={{ color: '#3483FA', textDecoration: 'none' }}>Gerenciar endereços</Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div style={styles.resumo}>
          <h2 style={styles.resumoTitulo}>Resumo</h2>
          <div style={styles.resumoLinha}><span>Subtotal</span><span>{fmt(total)}</span></div>
          
          <div style={styles.resumoLinha}>
            <span>Frete</span>
            <span style={frete.valor === 0 && idEnderecoSelecionado && !frete.carregando ? { color: '#00A650', fontWeight: '700' } : {}}>
              {frete.carregando ? 'Calculando...' : idEnderecoSelecionado ? (frete.valor === 0 ? 'Grátis 🎉' : fmt(frete.valor)) : 'Selecione o endereço'}
            </span>
          </div>

          {frete.prazo && !frete.carregando && (
            <p style={{ color: '#00A650', fontSize: '12px', textAlign: 'right', margin: '-6px 0 10px 0', fontWeight: 600 }}>
              Chega em até {frete.prazo} dias
            </p>
          )}

          <div style={{ ...styles.resumoLinha, fontWeight: 800, fontSize: 18, borderTop: '2px solid #eee', paddingTop: 12, marginTop: 8 }}>
            <span>Total</span><span>{fmt(total + frete.valor)}</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>Forma de pagamento</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)} style={styles.select}>
              <option value="pix">PIX (5% de desconto)</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="boleto">Boleto Bancário</option>
            </select>
          </div>

          <button onClick={handleFinalizar} disabled={finalizando || frete.carregando || !idEnderecoSelecionado} style={styles.btnFinalizar}>
            {finalizando ? 'Processando…' : '✅ Finalizar compra'}
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
  card:         { display: 'flex', gap: 16, background: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.1)', alignItems: 'center' },
  img:          { width: 100, height: 100, objectFit: 'cover', borderRadius: 6 },
  itemTitulo:   { fontWeight: 600, fontSize: 15, color: '#333', textDecoration: 'none' },
  qtdRow:       { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 },
  qtdBtn:       { padding: '4px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#f5f5f5', cursor: 'pointer', fontSize: 16 },
  qtdVal:       { fontWeight: 700, minWidth: 24, textAlign: 'center' },
  removerBtn:   { marginLeft: 8, background: 'transparent', border: 'none', color: '#999', fontSize: 13, cursor: 'pointer' },
  preco:        { fontWeight: 800, fontSize: 18, whiteSpace: 'nowrap' },
  resumo:       { width: 280, background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.1)', position: 'sticky', top: 80 },
  resumoTitulo: { fontSize: 18, fontWeight: 800, marginBottom: 16 },
  resumoLinha:  { display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 },
  label:        { fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 },
  select:       { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, background: '#fff', outline: 'none' },
  btnFinalizar: { width: '100%', background: '#FFE600', color: '#333', border: 'none', borderRadius: 8, padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer', marginTop: 16 },
  continuarLink:{ display: 'block', textAlign: 'center', marginTop: 12, color: '#3483FA', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  btn:          { background: '#3483FA', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none' },
};