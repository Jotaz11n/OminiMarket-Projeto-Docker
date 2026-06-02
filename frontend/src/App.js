import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarrinhoProvider } from './context/CarrinhoContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Produtos from './pages/Produtos';
import ProdutoDetalhe from './pages/ProdutoDetalhe';
import Carrinho from './pages/Carrinho';
import Pedidos from './pages/Pedidos';
import Perfil from './pages/Perfil';
import NovoAnuncio from './pages/NovoAnuncio';
import Admin from './pages/Admin';
import EditarAnuncio from './pages/EditarAnuncio';
import Enderecos from './pages/Enderecos'; // Importação da nova página adicionada aqui

export default function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <Navbar />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/cadastro"      element={<Registro />} />
          <Route path="/produtos"      element={<Produtos />} />
          <Route path="/produtos/:id"  element={<ProdutoDetalhe />} />
          <Route path="/carrinho"      element={<Carrinho />} />
          <Route path="/pedidos"       element={<Pedidos />} />
          <Route path="/perfil"        element={<Perfil />} />
          <Route path="/anunciar"      element={<NovoAnuncio />} />
          <Route path="/admin"         element={<Admin />} />
          <Route path="/editar-anuncio/:id" element={<EditarAnuncio />} />
          <Route path="/enderecos"     element={<Enderecos />} />
          <Route path="*"              element={<Navigate to="/" />} />
        </Routes>
      </CarrinhoProvider>
    </AuthProvider>
  );
}
