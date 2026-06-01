import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusColors = {
  aguardando_pagamento: '#FF9800',
  pago: '#3483FA',
  enviado: '#9C27B0',
  entregue: '#00A650',
  cancelado: '#F44336',
};
const statusLabels = {
  aguardando_pagamento: 'Aguardando Pagamento',
  pago: 'Pago',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

/* ─────────────────────────── PEDIDOS ─────────────────────────────── */
export function Pedidos() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    api.get('/pedidos').then(({ data }) => setPedidos(data)).finally(() => setLoading(false));
  }, [usuario]);

  if (!usuario) return <div style={{ textAlign: 'center', padding: 80 }}><Link to="/login" className="btn-primary">Faça login</Link></div>;
  if (loading) return <div className="spinner" />;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Minhas Compras</h1>
      {pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 8 }}>
          <p style={{ fontSize: 48 }}>📦</p>
          <p style={{ marginTop: 12, fontSize: 18 }}>Você ainda não fez compras</p>
          <Link to="/produtos" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Explorar produtos</Link>
        </div>
      ) : pedidos.map(p => (
        <div key={p.id} style={sP.card}>
          <div style={sP.header}>
            <div>
              <span style={sP.pedidoId}>Pedido #{p.id}</span>
              <span style={sP.data}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
            </div>
            <span style={{ ...sP.status, background: statusColors[p.status] + '22', color: statusColors[p.status] }}>
              {statusLabels[p.status]}
            </span>
          </div>
          <div style={sP.body}>
            <span>{p.qtd_itens} item(ns)</span>
            <strong style={{ fontSize: 18 }}>{fmt(p.total)}</strong>
          </div>
          <div style={sP.footer}>
            <span style={{ fontSize: 13, color: '#666' }}>
              💳 {p.metodo_pagamento === 'pix' ? 'PIX' : p.metodo_pagamento === 'cartao_credito' ? 'Cartão' : 'Boleto'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
const sP = {
  card: { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pedidoId: { fontWeight: 800, fontSize: 16 },
  data: { fontSize: 13, color: '#999', marginLeft: 12 },
  status: { fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
  body: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  footer: { borderTop: '1px solid #eee', paddingTop: 8 },
};

/* ─────────────────────────── PERFIL ─────────────────────────────── */
export function Perfil() {
  const { usuario, login } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    api.get('/usuarios/perfil').then(({ data }) => { setPerfil(data); setForm({ nome: data.nome, telefone: data.telefone || '' }); }).finally(() => setLoading(false));
  }, [usuario]);

  const salvar = async () => {
    await api.put('/usuarios/perfil', form);
    setPerfil({ ...perfil, ...form });
    login(localStorage.getItem('ml_token'), { ...usuario, nome: form.nome });
    setEdit(false);
    toast.success('Perfil atualizado!');
  };

  if (!usuario) return <div style={{ textAlign: 'center', padding: 80 }}><Link to="/login" className="btn-primary">Faça login</Link></div>;
  if (loading) return <div className="spinner" />;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40, maxWidth: 640 }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Meu Perfil</h1>
          <button onClick={() => setEdit(!edit)} style={{ background: '#3483FA', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
            {edit ? 'Cancelar' : '✏️ Editar'}
          </button>
        </div>
        {edit ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Nome</label>
            <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
            <label style={{ fontWeight: 600, fontSize: 13 }}>Telefone</label>
            <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
            <button onClick={salvar} style={{ background: '#FFE600', border: 'none', padding: '12px 0', borderRadius: 8, fontWeight: 800, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>Salvar</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[['Nome', perfil?.nome], ['E-mail', perfil?.email], ['Telefone', perfil?.telefone || '—'], ['CPF', perfil?.cpf || '—'], ['Reputação', '⭐'.repeat(Math.round(perfil?.reputacao || 5)) + ` (${perfil?.reputacao})`], ['Membro desde', new Date(perfil?.criado_em).toLocaleDateString('pt-BR')]].map(([k, v]) => (
              <div key={k} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>{k}</p>
                <p style={{ fontWeight: 600 }}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <Link to="/pedidos" style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 16, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.1)', fontWeight: 700 }}>📦 Minhas Compras</Link>
        <Link to="/anunciar" style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 16, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.1)', fontWeight: 700 }}>➕ Anunciar</Link>
      </div>
    </div>
  );
}
const inp = { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, width: '100%', background: '#fff' };

const F = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#555', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

/* ─────────────────────────── NOVO ANÚNCIO ─────────────────────────── */
export function NovoAnuncio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descricao: '', preco: '', preco_original: '',
    estoque: '', categoria_id: '', condicao: 'novo', frete_gratis: false,
    imagem: ''
  });

  useEffect(() => {
    api.get('/categorias').then(({ data }) => setCats(data));
  }, []);

  const handle = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!usuario) { toast.error('Faça login'); navigate('/login'); return; }
    setLoading(true);
    try {
      await api.post('/produtos', { ...form, imagens: form.imagem ? [form.imagem] : [] });
      toast.success('Anúncio criado com sucesso! 🎉');
      navigate('/produtos');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao criar anúncio');
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return <div style={{ textAlign: 'center', padding: 80 }}><Link to="/login" className="btn-primary">Faça login para anunciar</Link></div>;


  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40, maxWidth: 680 }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Criar Anúncio</h1>
        <form onSubmit={submit}>
          <F label="Título do produto *"><input name="titulo" value={form.titulo} onChange={handle} required style={inp} placeholder="Ex: Smartphone Samsung Galaxy A54 128GB" /></F>
          <F label="Descrição"><textarea name="descricao" value={form.descricao} onChange={handle} rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="Descreva o produto detalhadamente…" /></F>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <F label="Preço (R$) *"><input type="number" name="preco" value={form.preco} onChange={handle} required min="0.01" step="0.01" style={inp} placeholder="0,00" /></F>
            <F label="Preço original (opcional)"><input type="number" name="preco_original" value={form.preco_original} onChange={handle} min="0.01" step="0.01" style={inp} placeholder="Preço sem desconto" /></F>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <F label="Estoque *"><input type="number" name="estoque" value={form.estoque} onChange={handle} required min="1" style={inp} placeholder="Qtd disponível" /></F>
            <F label="Condição"><select name="condicao" value={form.condicao} onChange={handle} style={inp}><option value="novo">Novo</option><option value="usado">Usado</option><option value="recondicionado">Recondicionado</option></select></F>
            <F label="Categoria"><select name="categoria_id" value={form.categoria_id} onChange={handle} style={inp}><option value="">Selecione…</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></F>
          </div>
          <F label="URL da imagem principal"><input name="imagem" value={form.imagem} onChange={handle} style={inp} placeholder="https://…" /></F>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 24 }}>
            <input type="checkbox" name="frete_gratis" checked={form.frete_gratis} onChange={handle} />
            <span style={{ fontWeight: 600 }}>Oferecer frete grátis</span>
          </label>
          <button type="submit" disabled={loading} style={{ background: '#FFE600', border: 'none', width: '100%', padding: '14px 0', borderRadius: 8, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
            {loading ? 'Publicando…' : '🚀 Publicar anúncio'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Pedidos;
