import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // <--- IMPORTAÇÃO DA API CORRETA DO RAILWAY

export default function EditarAnuncio() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [titulo, setTitulo] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [estoque, setEstoque] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  // 1. Carrega os dados atuais do produto usando a API do Railway
  useEffect(() => {
    const carregarProduto = async () => {
      try {
        const { data } = await api.get(`/produtos/${id}`);
        
        setTitulo(data.titulo);
        setPreco(data.preco);
        setDescricao(data.descricao);
        setEstoque(data.estoque);
      } catch (err) {
        setErro(err.response?.data?.erro || 'Não foi possível carregar os dados do anúncio');
      } finally {
        setCarregando(false);
      }
    };

    carregarProduto();
  }, [id]);

  // 2. Envia os dados atualizados para o backend do Railway
  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      await api.put(`/produtos/${id}`, { 
        titulo, 
        preco: parseFloat(preco), 
        descricao, 
        estoque: parseInt(estoque) 
      });

      alert('Anúncio atualizado com sucesso no Omini Market!');
      navigate('/perfil'); // Volta para o perfil após salvar
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao atualizar anúncio');
    }
  };

  if (carregando) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#4B5563' }}>Carregando dados...</div>;
  }

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '90vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <h2 style={{ color: '#FF6B00', marginBottom: '20px', borderBottom: '2px solid #F3F4F6', paddingBottom: '10px' }}>
          Editar Anúncio
        </h2>

        {erro && <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{erro}</div>}

        <form onSubmit={handleSalvar}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#4B5563', marginBottom: '5px' }}>Título do Anúncio</label>
            <input 
              type="text" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#4B5563', marginBottom: '5px' }}>Preço (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={preco} 
                onChange={(e) => setPreco(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#4B5563', marginBottom: '5px' }}>Estoque Disponível</label>
              <input 
                type="number" 
                value={estoque} 
                onChange={(e) => setEstoque(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#4B5563', marginBottom: '5px' }}>Descrição do Produto</label>
            <textarea 
              rows="5"
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB', resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={() => navigate('/perfil')}
              style={{ backgroundColor: '#6B7280', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              style={{ backgroundColor: '#FF6B00', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Salvar Alterações
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
