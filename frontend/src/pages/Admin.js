import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt    = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtNum = v => new Intl.NumberFormat('pt-BR').format(v);

const STATUS_COLOR = {
  aguardando_pagamento: { bg: '#FFF8E1', color: '#E67E22', label: 'Aguardando' },
  pago:      { bg: '#EBF5FB', color: '#2980B9', label: 'Pago' },
  enviado:   { bg: '#F5EEF8', color: '#8E44AD', label: 'Enviado' },
  entregue:  { bg: '#EAFAF1', color: '#1E8449', label: 'Entregue' },
  cancelado: { bg: '#FDEDEC', color: '#C0392B', label: 'Cancelado' },
};
const METODO = { pix: '💚 PIX', cartao_credito: '💳 Cartão', boleto: '🏦 Boleto' };

function BarraHorizontal({ valor, maximo, cor }) {
  const pct = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
  return (
    <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: cor, height: '100%', borderRadius: 4, transition: 'width .5s' }} />
    </div>
  );
}

function KpiCard({ label, valor, sub, cor, icone }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,.09)', borderLeft: `5px solid ${cor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: .5 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#222', marginTop: 4 }}>{valor}</p>
          {sub && <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{sub}</p>}
        </div>
        <span style={{ fontSize: 32, opacity: .7 }}>{icone}</span>
      </div>
    </div>
  );
}

export default function Admin() {
  const { usuario }  = useAuth();
  const navigate     = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [dados, setDados]     = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CORREÇÃO 1: Adicionada a variável de estado que faltava para os filtros!
  const [filtroPedido, setFiltroPedido] = useState('');

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [dashRes, peds, prods, users] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/pedidos'),
        api.get('/admin/produtos'),
        api.get('/admin/usuarios'),
      ]);
      setDados(dashRes.data);
      setPedidos(peds.data);
      setProdutos(prods.data);
      setUsuarios(users.data);
    } catch (err) {
      toast.error('Erro ao carregar dados admin');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usuario === undefined) return; 
    if (!usuario || usuario.is_admin === 0 || usuario.is_admin === false) { 
      navigate('/'); 
      return; 
    }
    carregarDados();
  }, [usuario, navigate]);

  const aprovarPagamento = async (id, acao) => {
    const msg = acao === 'aprovar' ? 'Aprovar este pagamento?' : 'Reprovar este pagamento?';
    if (!window.confirm(msg)) return;
    try {
      const { data } = await api.patch(`/admin/pedidos/${id}/pagamento`, { acao });
      const novoStatus = acao === 'aprovar' ? 'pago' : 'cancelado';
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p));
      
      // CORREÇÃO 3: Usar setDados em vez de setDash
      setDados(prev => prev ? {
        ...prev,
        kpis: {
          ...prev.kpis,
          qtd_aguardando: Math.max(0, prev.kpis.qtd_aguardando - 1),
        },
        pedidos_urgentes: prev.pedidos_urgentes.filter(p => p.id !== id),
      } : prev);
      
      toast.success(data.mensagem);
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro'); }
  };

  const alterarStatus = async (id, status) => {
    try {
      await api.patch(`/pedidos/${id}/status`, { status });
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      toast.success('Status atualizado!');
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro'); }
  };

  const toggleAdmin = async (uid, val) => {
    try {
      await api.patch(`/admin/usuarios/${uid}/admin`, { is_admin: val });
      setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, is_admin: val } : u));
      toast.success(val ? 'Promovido a admin!' : 'Permissão removida!');
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro'); }
  };

  const removerProduto = async (id) => {
    if (!window.confirm('Remover este anúncio?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast.success('Anúncio removido!');
    } catch { toast.error('Erro ao remover'); }
  };

  if (!usuario?.is_admin) return null;
  if (loading) return <div className="spinner" />;

  const pedidosFiltrados = filtroPedido
    ? pedidos.filter(p => p.status === filtroPedido)
    : pedidos;

  const TABS = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'pagamentos', label: `💳 Pagamentos${dados?.kpis?.qtd_aguardando > 0 ? ` (${dados.kpis.qtd_aguardando} ⚠️)` : ''}` },
    { key: 'pedidos',   label: `📦 Pedidos (${pedidos.length})` },
    { key: 'produtos',  label: `🏷️ Anúncios (${produtos.length})` },
    { key: 'usuarios',  label: `👥 Usuários (${usuarios.length})` },
  ];

  const maxVendas = dados?.top_produtos?.length ? Math.max(...dados.top_produtos.map(p => p.total_vendas || 0), 1) : 1;

  return (
    <div style={{ background: '#F0F2F5', minHeight: '100vh' }}>
      <div style={s.adminHeader}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={s.adminTitle}>🛡️ Painel Administrativo</h1>
            <p style={s.adminSub}>Olá, {usuario.nome} · Sistema OmniMarket</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* CORREÇÃO 2: Botão agora chama carregarDados diretamente */}
            <button onClick={carregarDados} style={s.refreshBtn}>🔄 Atualizar</button>
            <Link to="/" style={s.backBtn}>← Voltar à loja</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div style={s.tabRow}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ ...s.tab, ...(tab === t.key ? s.tabAtivo : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && dados && (
          <div>
            <div style={s.kpiGrid}>
              <KpiCard label="Clientes ativos"  valor={fmtNum(dados.kpis.total_usuarios)}  icone="👥" cor="#3483FA" />
              <KpiCard label="Receita aprovada" valor={fmt(dados.kpis.receita_aprovada)}    icone="💰" cor="#00A650" sub="Pedidos pagos/enviados/entregues" />
              <KpiCard label="Aguardando pagto" valor={fmtNum(dados.kpis.qtd_aguardando)}   icone="⏳" cor="#E67E22" sub={`${fmt(dados.kpis.aguardando_total)} em espera`} />
              <KpiCard label="Total de pedidos" valor={fmtNum(dados.kpis.total_pedidos)}     icone="📦" cor="#9B59B6" sub={`${dados.kpis.cancelados} cancelados`} />
            </div>

            <div style={s.twoCol}>
              <div style={s.card}>
                <h2 style={s.cardTitle}>Volume por status</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                  {dados.pedidos_por_status.map(item => (
                    <div key={item.status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLOR[item.status]?.color }}>
                          {STATUS_COLOR[item.status]?.label}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{item.qtd} pedido{item.qtd !== 1 ? 's' : ''}</span>
                          <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{fmt(item.volume)}</span>
                        </div>
                      </div>
                      <BarraHorizontal valor={parseInt(item.qtd)} maximo={dados.kpis.total_pedidos} cor={STATUS_COLOR[item.status]?.color} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.card}>
                <h2 style={s.cardTitle}>Produtos por categoria</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {dados.vendas_categoria.map(c => (
                    <div key={c.categoria} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20, minWidth: 28 }}>{c.icone}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{c.categoria}</span>
                          <span style={{ fontSize: 12, color: '#888' }}>{c.qtd_produtos} produtos</span>
                        </div>
                        <BarraHorizontal valor={c.total_vendas} maximo={Math.max(...dados.vendas_categoria.map(x => x.total_vendas), 1)} cor="#3483FA" />
                      </div>
                      <span style={{ fontSize: 12, color: '#555', minWidth: 40, textAlign: 'right' }}>
                        {c.total_vendas} vend.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={s.twoCol}>
              <div style={s.card}>
                <h2 style={s.cardTitle}>
                  ⏳ Pagamentos aguardando aprovação
                  {dados.pedidos_urgentes.length > 0 && (
                    <span style={{ marginLeft: 8, background: '#E67E22', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                      {dados.pedidos_urgentes.length}
                    </span>
                  )}
                </h2>
                {dados.pedidos_urgentes.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 14, marginTop: 12, textAlign: 'center', padding: '20px 0' }}>
                    ✅ Nenhum pagamento pendente
                  </p>
                ) : dados.pedidos_urgentes.map(p => (
                  <div key={p.id} style={s.urgentRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <strong style={{ fontSize: 14 }}>Pedido #{p.id}</strong>
                        <span style={{ fontSize: 11, background: '#FFF8E1', color: '#E67E22', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                          {METODO[p.metodo_pagamento] || p.metodo_pagamento}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {p.comprador_nome} · {p.qtd_itens} item(ns) · {new Date(p.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                      <p style={{ fontWeight: 800, fontSize: 16, marginTop: 4, color: '#222' }}>{fmt(p.total)}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button onClick={() => aprovarPagamento(p.id, 'aprovar')} style={s.btnAprovar}>✅ Aprovar</button>
                      <button onClick={() => aprovarPagamento(p.id, 'reprovar')} style={s.btnReprovar}>❌ Reprovar</button>
                    </div>
                  </div>
                ))}
                {dados.pedidos_urgentes.length > 0 && (
                  <button onClick={() => setTab('pagamentos')} style={s.verTodosBtn}>Ver todos os pagamentos →</button>
                )}
              </div>

              <div style={s.card}>
                <h2 style={s.cardTitle}>🏆 Top 5 produtos</h2>
                {dados.top_produtos.map((p, i) => (
                  <div key={p.id} style={s.topRow}>
                    <span style={{ ...s.topNum, color: i < 3 ? ['#F5A623','#9B9B9B','#CD7F32'][i] : '#ccc' }}>#{i + 1}</span>
                    <img src={p.imagem || `https://picsum.photos/seed/${p.id}/48/48`} alt="" style={s.topImg} onError={e => { e.target.src = `https://picsum.photos/seed/${p.id+30}/48/48`; }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.titulo}</p>
                      <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.categoria_nome}</p>
                      <div style={{ marginTop: 4 }}>
                        <BarraHorizontal valor={p.total_vendas || 0} maximo={maxVendas} cor="#FFE600" />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: 14 }}>{fmtNum(p.total_vendas)}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>vendidos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.card}>
              <h2 style={s.cardTitle}>👥 Últimos clientes cadastrados</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                {dados.novos_usuarios.map(u => (
                  <div key={u.id} style={s.userChip}>
                    <div style={s.userAvatar}>{u.nome[0].toUpperCase()}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>{u.nome}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{new Date(u.criado_em).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MANTIVE O RESTANTE DO TEU CÓDIGO (PAGAMENTOS, PEDIDOS, PRODUTOS E USUÁRIOS) */}
        {tab === 'pagamentos' && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={s.cardTitle}>💳 Aprovação de Pagamentos</h2>
            </div>
            {pedidos.filter(p => p.status === 'aguardando_pagamento').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                <p style={{ fontSize: 48 }}>✅</p>
                <p style={{ marginTop: 12, fontSize: 16 }}>Nenhum pagamento pendente</p>
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>Pedido</th><th style={s.th}>Comprador</th><th style={s.th}>Itens</th>
                    <th style={s.th}>Total</th><th style={s.th}>Pagamento</th><th style={s.th}>Data</th><th style={s.th}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.filter(p => p.status === 'aguardando_pagamento').map(p => (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}><strong>#{p.id}</strong></td>
                      <td style={s.td}><strong>{p.comprador_nome}</strong></td>
                      <td style={s.td}>{p.qtd_itens}</td>
                      <td style={s.td}><strong>{fmt(p.total)}</strong></td>
                      <td style={s.td}>{METODO[p.metodo_pagamento] || p.metodo_pagamento}</td>
                      <td style={s.td}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => aprovarPagamento(p.id, 'aprovar')} style={s.btnAprovar}>✅</button>
                          <button onClick={() => aprovarPagamento(p.id, 'reprovar')} style={s.btnReprovar}>❌</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'pedidos' && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={s.cardTitle}>📦 Todos os Pedidos</h2>
              <select value={filtroPedido} onChange={e => setFiltroPedido(e.target.value)} style={{ ...s.select, width: 180 }}>
                <option value="">Todos os status</option>
                {Object.entries(STATUS_COLOR).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>#</th><th style={s.th}>Comprador</th><th style={s.th}>Total</th><th style={s.th}>Status</th><th style={s.th}>Alterar</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map(p => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>#{p.id}</td>
                    <td style={s.td}><strong>{p.comprador_nome}</strong></td>
                    <td style={s.td}>{fmt(p.total)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: STATUS_COLOR[p.status]?.bg, color: STATUS_COLOR[p.status]?.color }}>
                        {STATUS_COLOR[p.status]?.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <select value={p.status} onChange={e => alterarStatus(p.id, e.target.value)} style={s.select}>
                        {Object.entries(STATUS_COLOR).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'produtos' && (
          <div style={s.card}>
            <h2 style={{ ...s.cardTitle, marginBottom: 16 }}>🏷️ Todos os Anúncios</h2>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Produto</th><th style={s.th}>Preço</th><th style={s.th}>Vendidos</th><th style={s.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}><strong>{p.titulo}</strong></td>
                    <td style={s.td}>{fmt(p.preco)}</td>
                    <td style={s.td}>{p.total_vendas}</td>
                    <td style={s.td}>
                      <button onClick={() => removerProduto(p.id)} style={{ background: '#FDEDEC', color: '#C0392B', border: 'none', padding: '5px 9px', borderRadius: 4, cursor: 'pointer' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'usuarios' && (
          <div style={s.card}>
            <h2 style={{ ...s.cardTitle, marginBottom: 16 }}>👥 Gestão de Usuários</h2>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Nome</th><th style={s.th}>E-mail</th><th style={s.th}>Perfil</th><th style={s.th}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}><strong>{u.nome}</strong></td>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...(u.is_admin ? { background: '#333', color: '#FFE600' } : { background: '#f0f0f0', color: '#666' }) }}>
                        {u.is_admin ? '⚡ Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td style={s.td}>
                      {u.id !== usuario.id && (
                        <button onClick={() => toggleAdmin(u.id, !u.is_admin)} style={{ background: u.is_admin ? '#FDEDEC' : '#EAFAF1', color: u.is_admin ? '#C0392B' : '#1E8449', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>
                          {u.is_admin ? 'Remover admin' : 'Tornar admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  adminHeader: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '20px 0', color: '#fff' },
  adminTitle:  { fontSize: 24, fontWeight: 800, color: '#fff' },
  adminSub:    { fontSize: 13, color: '#aaa', marginTop: 4 },
  refreshBtn:  { background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  backBtn:     { background: '#FFE600', color: '#333', padding: '8px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, textDecoration: 'none' },
  tabRow:      { display: 'flex', gap: 4, marginBottom: 20, background: '#fff', padding: 6, borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.08)', flexWrap: 'wrap' },
  tab:         { flex: 1, padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#666', whiteSpace: 'nowrap' },
  tabAtivo:    { background: '#1a1a2e', color: '#FFE600' },
  kpiGrid:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 },
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  card:        { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,.08)', marginBottom: 16 },
  cardTitle:   { fontSize: 16, fontWeight: 800, color: '#222' },
  urgentRow:   { display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f5f5f5' },
  topRow:      { display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  topNum:      { fontWeight: 900, fontSize: 20, minWidth: 32, textAlign: 'center' },
  topImg:      { width: 48, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 },
  userChip:    { display: 'flex', gap: 10, alignItems: 'center', background: '#f8f8f8', borderRadius: 8, padding: '10px 14px' },
  userAvatar:  { width: 36, height: 36, borderRadius: '50%', background: '#FFE600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 },
  verTodosBtn: { width: '100%', background: 'transparent', border: 'none', color: '#3483FA', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 12, padding: '8px 0', borderTop: '1px solid #f0f0f0' },
  btnAprovar:  { background: '#EAFAF1', color: '#1E8449', border: '1px solid #A9DFBF', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnReprovar: { background: '#FDEDEC', color: '#C0392B', border: '1px solid #F5B7B1', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  thead:       { background: '#F8F9FA' },
  th:          { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666', borderBottom: '2px solid #eee', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #F0F0F0' },
  td:          { padding: '12px 14px', fontSize: 13, verticalAlign: 'middle' },
  badge:       { fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', display: 'inline-block' },
  select:      { padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, background: '#fff' },
};