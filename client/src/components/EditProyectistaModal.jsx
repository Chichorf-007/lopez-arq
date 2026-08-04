import React, { useState } from 'react';

export default function EditProyectistaModal({ token, proyectista, onClose, onSuccess }) {
  const isEditing = Boolean(proyectista);

  const [name, setName] = useState(proyectista?.name || '');
  const [username, setUsername] = useState(proyectista?.username || '');
  const [ratePerHour, setRatePerHour] = useState(proyectista?.rate_per_hour || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !username.trim()) {
      return setError('Nombre y usuario son obligatorios');
    }

    if (!isEditing && !password) {
      return setError('Ingrese una contraseña para la cuenta del proyectista');
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/proyectistas/${proyectista.id}` : '/api/proyectistas';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          rate_per_hour: parseFloat(ratePerHour) || 0,
          password: password || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar proyectista');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? `✏️ Editar Proyectista: ${proyectista.name}` : '👤 Nuevo Proyectista'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Visible / Nombre Completo</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Arq. Carlos Benítez o Proyectista 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nombre de Usuario (Para Login)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: proyectista1 o cbenitez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tarifa por Hora en Guaraníes (₲/hs)</label>
            <input
              type="number"
              step="1000"
              min="0"
              className="form-input"
              placeholder="Ej: 50000"
              value={ratePerHour}
              onChange={(e) => setRatePerHour(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
              Este costo lo ves <strong>únicamente tú (Maru López)</strong> para los cálculos automáticos de presupuestos y facturación.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">
              {isEditing ? 'Nueva Contraseña (Opcional - dejar en blanco para mantener actual)' : 'Contraseña de Acceso'}
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEditing}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Proyectista')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
