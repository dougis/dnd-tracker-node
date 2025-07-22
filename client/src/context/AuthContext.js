import React, { createContext, useState, useEffect } from 'react';
import ApiService from './services/ApiService';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You would typically verify the token with the backend here
      // For simplicity, we'll just assume the token is valid
      // and decode it to get user information.
      // In a real app, you'd make an API call to get the user data.
      setUser({ token }); // Replace with actual user data
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await ApiService.post('/users/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser({ token: data.token });
  };

  const register = async (email, password) => {
    const { data } = await ApiService.post('/users/register', { email, password });
    localStorage.setItem('token', data.token);
    setUser({ token: data.token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
