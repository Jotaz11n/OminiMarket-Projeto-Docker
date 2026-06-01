import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario]     = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ml_token');
    const user  = localStorage.getItem('ml_usuario');
    if (token && user) {
      setUsuario(JSON.parse(user));
    }
    setCarregando(false);
  }, []);

  const login = (token, user) => {
    localStorage.setItem('ml_token', token);
    localStorage.setItem('ml_usuario', JSON.stringify(user));
    setUsuario(user);
  };

  const logout = () => {
    localStorage.removeItem('ml_token');
    localStorage.removeItem('ml_usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
