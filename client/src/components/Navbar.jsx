import React from 'react';
import { LogOut, User, Building2, Crown } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-logo">
          <div className="logo-icon">LA</div>
          <div>
            <span>LOPEZ ARQ</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 400 }}>
              Maru López & Asociados
            </span>
          </div>
          <span className="brand-tag">v1.0</span>
        </div>

        <div className="user-badge">
          <div className={`role-pill ${isAdmin ? 'admin' : 'proyectista'}`}>
            {isAdmin ? <Crown size={14} /> : <User size={14} />}
            <span>{isAdmin ? 'Dirección (Maru López)' : 'Proyectista'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user?.username}</span>
          </div>

          <button onClick={onLogout} className="btn btn-secondary btn-sm" title="Cerrar Sesión">
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
