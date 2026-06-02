import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast'; // Adicionando o toast para feedbacks visuais

const CarrinhoContext = createContext();

export const CarrinhoProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [itens, setItens]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCarrinho = async () => {
    if (!usuario) { 
      setItens([]); 
      setTotal(0); 
      return; 
    }
    
    try {
      setLoading(true);
      const { data } = await api.get('/carrinho');
      setItens(data.itens || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Erro ao buscar carrinho:", error);
      setItens([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCarrinho(); 
  }, [usuario]);

  const adicionarItem = async (produto_id, quantidade = 1) => {
    if (!usuario) {
      toast.error('Você precisa fazer login para adicionar itens ao carrinho!');
      return;
    }

    try {
      await api.post('/carrinho', { produto_id, quantidade });
      toast.success('Produto adicionado ao carrinho!');
      fetchCarrinho();
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao adicionar produto');
    }
  };

  const removerItem = async (id) => {
    try {
      await api.delete(`/carrinho/${id}`);
      fetchCarrinho();
    } catch (error) {
      toast.error('Erro ao remover item do carrinho');
    }
  };

  const atualizarQtd = async (id, quantidade) => {
    try {
      await api.put(`/carrinho/${id}`, { quantidade });
      fetchCarrinho();
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao atualizar quantidade');
    }
  };

  return (
    <CarrinhoContext.Provider value={{ itens, total, loading, adicionarItem, removerItem, atualizarQtd, fetchCarrinho }}>
      {children}
    </CarrinhoContext.Provider>
  );
};

export const useCarrinho = () => useContext(CarrinhoContext);
