import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FormWrap = ({ children, title, sub }) => (
  <div style={styles.wrap}>
    <div style={styles.card}>
      <h1 style={styles.h1}>{title}</h1>
      {sub && <p style={styles.sub}>{sub}</p>}
      {children}
    </div>
  </div>
);

export function Login() {
  const { login }           = useAuth();
  const navigate            = useNavigate();
  const [form, setForm]     = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.usuario);
      toast.success(`Bem-vindo, ${data.usuario.nome}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrap title="Entre na sua conta" sub="Ou use: joao@email.com / 123456">
      <form onSubmit={submit} style={styles.form}>
        <label style={styles.label}>E-mail</label>
        <input type="email" name="email" value={form.email} onChange={handle} required style={styles.input} placeholder="seu@email.com" />

        <label style={styles.label}>Senha</label>
        <input type="password" name="senha" value={form.senha} onChange={handle} required style={styles.input} placeholder="••••••" />

        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p style={styles.link}>Não tem conta? <Link to="/cadastro" style={{ color: '#3483FA' }}>Cadastre-se</Link></p>
    </FormWrap>
  );
}

export function Registro() {
  const { login }           = useAuth();
  const navigate            = useNavigate();
  const [form, setForm]     = useState({ nome: '', email: '', senha: '', telefone: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/registrar', form);
      login(data.token, data.usuario);
      toast.success('Conta criada com sucesso! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrap title="Crie sua conta">
      <form onSubmit={submit} style={styles.form}>
        <label style={styles.label}>Nome completo</label>
        <input name="nome" value={form.nome} onChange={handle} required style={styles.input} placeholder="João Silva" />

        <label style={styles.label}>E-mail</label>
        <input type="email" name="email" value={form.email} onChange={handle} required style={styles.input} placeholder="seu@email.com" />

        <label style={styles.label}>Senha</label>
        <input type="password" name="senha" value={form.senha} onChange={handle} required style={styles.input} placeholder="Mínimo 6 caracteres" />

        <label style={styles.label}>Telefone (opcional)</label>
        <input name="telefone" value={form.telefone} onChange={handle} style={styles.input} placeholder="(11) 99999-9999" />

        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <p style={styles.link}>Já tem conta? <Link to="/login" style={{ color: '#3483FA' }}>Entrar</Link></p>
    </FormWrap>
  );
}

const styles = {
  wrap:   { minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDEDED', padding: 24 },
  card:   { background: '#fff', borderRadius: 8, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 2px 12px rgba(0,0,0,.12)' },
  h1:     { fontSize: 24, fontWeight: 800, marginBottom: 4 },
  sub:    { color: '#666', fontSize: 13, marginBottom: 20 },
  form:   { display: 'flex', flexDirection: 'column', gap: 4 },
  label:  { fontSize: 13, fontWeight: 600, color: '#555', marginTop: 12 },
  input:  { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', marginTop: 4 },
  btn:    { background: '#3483FA', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer', marginTop: 20 },
  link:   { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#666' },
};

export default Login;
