import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ProyectistaDashboard from './components/ProyectistaDashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('lopez_arq_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error al verificar token:', err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('lopez_arq_token');
    setToken('');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-dark)',
        color: 'var(--accent-gold)',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        Cargando Lopez Arq...
      </div>
    );
  }

  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        {user.role === 'ADMIN' ? (
          <AdminDashboard token={token} user={user} />
        ) : (
          <ProyectistaDashboard token={token} user={user} />
        )}
      </main>
    </div>
  );
}
