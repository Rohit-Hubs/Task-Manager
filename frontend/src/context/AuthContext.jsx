import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Fetch actual user data from the server
      getMe()
        .then((data) => {
          if (data.id) {
            setUser({ id: data.id, username: data.username, role: data.role, email: data.email });
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
          } else {
            // Token is invalid
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginUser = (accessToken, username, role) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    setToken(accessToken);
    setUser({ username, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e17' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
