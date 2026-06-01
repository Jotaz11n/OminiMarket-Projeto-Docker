import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CarrinhoContext = createContext();

export const CarrinhoProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [itens, setItens]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCarrinho = async () => {
    if (!usuario) { setItens([]); setTotal(0); return; }
    try {
      setLoading(true);
      const { data } = await api.get('/carrinho');
      setItens(data.itens);
      setTotal(data.total);
    } catch {
      setItens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCarrinho(); }, [usuario]);

  const adicionarItem = async (produto_id, quantidade = 1) => {
    await api.post('/carrinho', { produto_id, quantidade });
    fetchCarrinho();
  };

  const removerItem = async (id) => {
    await api.delete(`/carrinho/${id}`);
    fetchCarrinho();
  };

  const atualizarQtd = async (id, quantidade) => {
    await api.put(`/carrinho/${id}`, { quantidade });
    fetchCarrinho();
  };

  return (
    <CarrinhoContext.Provider value={{ itens, total, loading, adicionarItem, removerItem, atualizarQtd, fetchCarrinho }}>
      {children}
    </CarrinhoContext.Provider>
  );
};

export const useCarrinho = () => useContext(CarrinhoContext);
