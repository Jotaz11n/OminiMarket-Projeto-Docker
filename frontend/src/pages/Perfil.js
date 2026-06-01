import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusColors = {
  ativo:    { bg: '#EAFAF1', color: '#00A650' },
  pausado:  { bg: '#FFF8E1', color: '#F39C12' },
  vendido:  { bg: '#EBF5FB', color: '#0052CC' },
  removido: { bg: '#FDEDEC', color: '#E74C3C' },
};

export default function Perfil() {
  const { usuario, login }   = useAuth();
  const navigate             = useNavigate();
  const [perfil, setPerfil]  = useState(null);
  const [meusProdutos, setMeusProdutos] = useState([]);
  const [edit, setEdit]      = useState(false);
  const [form, setForm]      = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab]        = useState('dados'); // 'dados' | 'anuncios'

  useEffect(() => {
    if (!usuario) return;
    Promise.all([
      api.get('/usuarios/perfil'),
      api.get('/usuarios/meus-produtos'),
    ])
      // CORRIGIDO: Removidos os colchetes extras [ ] que envolviam a arrow function
      .then(([{ data: p }, { data: prods }]) => {
        setPerfil(p);
        setMeusProdutos(prods);
        setForm({ nome: p.nome, telefone: p.telefone || '' });
      })
      .catch(err => {
        console.error("Erro ao carregar dados do perfil:", err);
        toast.error("Não foi possível carregar seus anúncios.");
      })
      .finally(() => setLoading(false));
  }, [usuario]);
  const salvar = async () => {
    try {
      await api.put('/usuarios/perfil', form);
      setPerfil({ ...perfil, ...form });
      login(localStorage.getItem('ml_token'), { ...usuario, nome: form.nome });
      setEdit(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao salvar as informações');
    }
  };

  const removerProduto = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este anúncio?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      setMeusProdutos(prev => prev.filter(p => p.id !== id));
      toast.success('Anúncio removido!');
    } catch {
      toast.error('Erro ao remover anúncio');
    }
  };

  if (!usuario) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Link to="/login" className="btn-primary" style={{ display: 'inline-block' }}>Faça login</Link>
    </div>
  );
  if (loading) return <div className="spinner" />;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40, backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.avatarArea}>
            <div style={styles.avatar}>{perfil?.nome?.[0]?.toUpperCase()}</div>
            <p style={styles.sidebarNome}>{perfil?.nome}</p>
            <p style={styles.sidebarEmail}>{perfil?.email}</p>
            {perfil?.is_admin && <span style={styles.adminTag}>⚡ Administrador</span>}
          </div>
          <nav style={styles.sidenav}>
            <button onClick={() => setTab('dados')}    style={{ ...styles.navBtn, ...(tab === 'dados'    ? styles.navBtnAtivo : {}) }}>👤 Meus dados</button>
            <button onClick={() => setTab('anuncios')} style={{ ...styles.navBtn, ...(tab === 'anuncios' ? styles.navBtnAtivo : {}) }}>📦 Meus anúncios ({meusProdutos.length})</button>
            <Link to="/pedidos"  style={styles.navLink}>🛒 Minhas compras</Link>
            <Link to="/anunciar" style={styles.navLink}>➕ Novo anúncio</Link>
            {usuario.is_admin && <Link to="/admin" style={{ ...styles.navLink, color: '#DC2626', fontWeight: 700 }}>🛡️ Painel Admin</Link>}
          </nav>
        </aside>

        {/* Conteúdo */}
        <div style={{ flex: 1 }}>
          {tab === 'dados' && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Meus dados</h2>
                <button onClick={() => setEdit(!edit)} style={styles.editBtn}>
                  {edit ? 'Cancelar' : '✏️ Editar'}
                </button>
              </div>
              {edit ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[['Nome', 'nome', 'text'], ['Telefone', 'telefone', 'text']].map(([lbl, key, type]) => (
                    <div key={key}>
                      <label style={styles.fieldLabel}>{lbl}</label>
                      <input type={type} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} style={styles.input} />
                    </div>
                  ))}
                  <button onClick={salvar} style={styles.btnSalvar}>Salvar</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    ['Nome',         perfil?.nome],
                    ['E-mail',        perfil?.email],
                    ['Telefone',      perfil?.telefone || '—'],
                    ['CPF',           perfil?.cpf || '—'],
                    ['Reputação',     '⭐'.repeat(Math.round(perfil?.reputacao || 5)) + ` (${perfil?.reputacao})`],
                    ['Membro desde',  new Date(perfil?.criado_em).toLocaleDateString('pt-BR')],
                  ].map(([k, v]) => (
                    <div key={k} style={styles.fieldRow}>
                      <span style={styles.fieldKey}>{k}</span>
                      <span style={styles.fieldVal}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'anuncios' && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Meus anúncios</h2>
                <Link to="/anunciar" style={styles.editBtn}>➕ Novo</Link>
              </div>
              {meusProdutos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <p style={{ fontSize: 40 }}>📦</p>
                  <p style={{ marginTop: 8 }}>Você ainda não tem anúncios</p>
                  <Link to="/anunciar" style={{ color: '#0052CC', fontWeight: 700 }}>Criar primeiro anúncio</Link>
                </div>
              ) : meusProdutos.map(p => (
                <div key={p.id} style={styles.prodRow}>
                  <img
                    src={p.imagem || `https://picsum.photos/seed/${p.id}/80/80`}
                    alt={p.titulo}
                    style={styles.prodImg}
                    onError={e => { e.target.src = `https://picsum.photos/seed/${p.id+5}/80/80`; }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={styles.prodTitulo}>{p.titulo}</p>
                    <p style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                      {p.categoria_nome || 'Sem categoria'} · Estoque: {p.estoque} · {p.total_vendas} vendidos
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{fmt(p.preco)}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{ ...styles.statusBadge, background: statusColors[p.status]?.bg, color: statusColors[p.status]?.color }}>
                      {p.status}
                    </span>
                    {/* 🌟 ROTA DE EDIÇÃO ATUALIZADA AQUI */}
                    <Link to={`/editar-anuncio/${p.id}`} style={styles.btnEditar}>✏️ Editar</Link>
                    <button onClick={() => removerProduto(p.id)} style={styles.btnRemover}>🗑 Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout:      { display: 'flex', gap: 24, alignItems: 'flex-start' },
  sidebar:     { width: 240, background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.1)', flexShrink: 0, position: 'sticky', top: 80 },
  avatarArea:  { textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #eee' },
  avatar:      { width: 64, height: 64, borderRadius: '50%', background: '#FF6B00', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, margin: '0 auto 10px' },
  sidebarNome: { fontWeight: 700, fontSize: 16 },
  sidebarEmail:{ fontSize: 12, color: '#999', marginTop: 2 },
  adminTag:    { display: 'inline-block', marginTop: 6, background: '#333', color: '#FF6B00', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 },
  sidenav:     { display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn:      { background: 'transparent', border: 'none', padding: '10px 12px', borderRadius: 6, textAlign: 'left', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#555' },
  navBtnAtivo: { background: '#E6F0FF', color: '#0052CC' },
  navLink:     { display: 'block', padding: '10px 12px', borderRadius: 6, fontWeight: 600, fontSize: 14, color: '#555', textDecoration: 'none' },
  card:        { background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle:   { fontSize: 20, fontWeight: 800 },
  editBtn:     { background: '#0052CC', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'none' },
  fieldRow:    { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  fieldKey:    { fontSize: 13, color: '#999' },
  fieldVal:    { fontWeight: 600 },
  fieldLabel:  { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  input:       { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 },
  btnSalvar:   { background: '#FF6B00', color: '#FFF', border: 'none', padding: '13px 0', borderRadius: 8, fontWeight: 800, fontSize: 16, cursor: 'pointer', marginTop: 8 },
  prodRow:     { display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' },
  prodImg:     { width: 80, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 },
  prodTitulo:  { fontWeight: 600, fontSize: 14 },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  btnEditar:   { fontSize: 13, color: '#0052CC', fontWeight: 700, textDecoration: 'none', background: '#E6F0FF', padding: '4px 10px', borderRadius: 4 },
  btnRemover:  { fontSize: 12, color: '#E74C3C', background: '#FDEDEC', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 },
};