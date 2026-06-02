import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px' },
  titulo: { fontSize: '24px', fontWeight: '800', marginBottom: '20px' },
  card: { background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'flex', gap: '12px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' },
  btnSalvar: { background: '#3483FA', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 24px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  btnCancelar: { background: '#eee', color: '#333', border: 'none', borderRadius: '6px', padding: '12px 24px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  gridEnderecos: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '20px' },
  itemEndereco: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #eee' },
  acoes: { display: 'flex', gap: '12px', alignItems: 'center' },
  btnEditar: { background: 'transparent', border: 'none', color: '#3483FA', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnRemover: { background: 'transparent', border: 'none', color: '#cc0000', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }
};

export default function Enderecos() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState({ id: null, rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', complemento: '' });
  const [editando, setEditando] = useState(false);

  const buscarEnderecos = async () => {
    try {
      const { data } = await api.get('/enderecos'); // <-- Mudado para plural
      setLista(data);
    } catch (err) {
      toast.error('Erro ao buscar seus endereços.');
    } finally {
      setCarregando(false);
    }
  };
  
  useEffect(() => {
    buscarEnderecos();
  }, []);

  const lidarMudanca = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const iniciarEdicao = (end) => {
    setEditando(true);
    setForm({
      id: end.id,
      rua: end.rua,
      numero: end.numero,
      bairro: end.bairro,
      cidade: end.cidade,
      estado: end.estado,
      cep: end.cep,
      complemento: end.complemento || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setForm({ id: null, rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', complemento: '' });
  };

 const salvarEndereco = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        // Rota PUT para atualizar o endereço existente
        await api.put(`/enderecos/${form.id}`, form); // <-- Mudado para plural
        toast.success('Endereço atualizado com sucesso! 📝');
      } else {
        // Rota POST para criar um novo endereço
        await api.post('/enderecos', form); // <-- Mudado para plural
        toast.success('Endereço adicionado com sucesso! 🎉');
      }
      cancelarEdicao();
      buscarEnderecos();
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar endereço.');
    }
  };

  const deletarEndereco = async (id) => {
    if (!window.confirm('Deseja realmente remover este endereço?')) return;
    try {
      await api.delete(`/enderecos/${id}`); // <-- Mudado para plural
      toast.success('Endereço removido.');
      if (editando && form.id === id) cancelarEdicao();
      buscarEnderecos();
    } catch (err) {
      toast.error('Erro ao remover endereço.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Meus Endereços</h1>

      {/* Formulário de Cadastro / Edição */}
      <div style={styles.card}>
        <h3 style={{ marginBottom: '14px' }}>
          {editando ? '📝 Editar Endereço' : '➕ Cadastrar Novo Endereço'}
        </h3>
        <form onSubmit={salvarEndereco} style={styles.form}>
          <div style={styles.row}>
            <input type="text" name="cep" placeholder="CEP (ex: 09000-000)" value={form.cep} onChange={lidarMudanca} required style={styles.input} />
            <input type="text" name="estado" placeholder="UF (ex: SP)" maxLength="2" value={form.estado} onChange={lidarMudanca} required style={{ ...styles.input, width: '90px' }} />
          </div>
          <div style={styles.row}>
            <input type="text" name="rua" placeholder="Rua / Avenida" value={form.rua} onChange={lidarMudanca} required style={styles.input} />
            <input type="text" name="numero" placeholder="Número" value={form.numero} onChange={lidarMudanca} required style={{ ...styles.input, width: '150px' }} />
          </div>
          <div style={styles.row}>
            <input type="text" name="bairro" placeholder="Bairro" value={form.bairro} onChange={lidarMudanca} required style={styles.input} />
            <input type="text" name="complemento" placeholder="Complemento (Opcional)" value={form.complemento} onChange={lidarMudanca} style={styles.input} />
          </div>
          <input type="text" name="cidade" placeholder="Cidade" value={form.cidade} onChange={lidarMudanca} required style={styles.input} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={styles.btnSalvar}>
              {editando ? 'Salvar Alterações' : 'Salvar Endereço'}
            </button>
            {editando && (
              <button type="button" onClick={cancelarEdicao} style={styles.btnCancelar}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Endereços Salvos */}
      <h3>Endereços Salvos</h3>
      {carregando ? (
        <p>Carregando...</p>
      ) : lista.length === 0 ? (
        <p style={{ color: '#666', marginTop: '10px' }}>Nenhum endereço cadastrado ainda.</p>
      ) : (
        <div style={styles.gridEnderecos}>
          {lista.map((end) => (
            <div key={end.id} style={styles.itemEndereco}>
              <div>
                <p style={{ fontWeight: '600' }}>{end.rua}, {end.numero}</p>
                {end.complemento && <p style={{ fontSize: '13px', color: '#555' }}>Comp: {end.complemento}</p>}
                <p style={{ fontSize: '13px', color: '#666' }}>{end.bairro} - {end.cidade}/{end.estado.toUpperCase()}</p>
                <p style={{ fontSize: '12px', color: '#999' }}>CEP: {end.cep}</p>
              </div>
              <div style={styles.acoes}>
                <button onClick={() => iniciarEdicao(end)} style={styles.btnEditar}>✏️ Editar</button>
                <button onClick={() => deletarEndereco(end.id)} style={styles.btnRemover}>🗑 Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
