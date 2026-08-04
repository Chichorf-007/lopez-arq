import React, { useState, useMemo } from 'react';
import { Clock, Calendar, FileText, Building2, User } from 'lucide-react';

export default function NewTimesheetModal({ token, user, projects, proyectistas, onClose, onSuccess }) {
  const isAdmin = user.role === 'ADMIN';
  const today = new Date().toISOString().split('T')[0];

  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [targetUserId, setTargetUserId] = useState(user.id);
  const [workDate, setWorkDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Compute calculated hours automatically
  const calculatedHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    const diff = endMinutes - startMinutes;
    return Math.round((diff / 60) * 100) / 100;
  }, [startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!projectId) return setError('Por favor seleccione una obra.');
    if (!startTime || !endTime) return setError('La hora de inicio y fin son obligatorias.');
    if (calculatedHours <= 0) return setError('La hora de fin debe ser posterior a la hora de inicio.');
    if (!description.trim()) return setError('Ingrese una descripción del trabajo realizado.');

    setLoading(true);
    try {
      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          user_id: isAdmin ? targetUserId : user.id,
          work_date: workDate,
          start_time: startTime,
          end_time: endTime,
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar registro');

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
          <h3>⏱️ Cargar Registro de Horas</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isAdmin && proyectistas && (
            <div className="form-group">
              <label className="form-label">Cargar a Nombre de Proyectista</label>
              <select
                className="form-select"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                {proyectistas.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (@{p.username})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Obra / Proyecto *</label>
            <select
              className="form-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha del Trabajo *</label>
            <input
              type="date"
              className="form-input"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              required
            />
          </div>

          {/* Horario de Inicio y Fin (Obligatorio) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Hora de Inicio (Obligatorio) *</label>
              <input
                type="time"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hora de Fin (Obligatorio) *</label>
              <input
                type="time"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Real-time calculated total badge */}
          <div style={{
            background: 'var(--accent-gold-glow)',
            border: '1px solid var(--border-highlight)',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Horario asignado: <strong style={{ color: '#FFF' }}>{startTime} a {endTime} hs</strong>
            </span>
            <span style={{
              fontWeight: 800,
              color: 'var(--accent-gold)',
              fontSize: '1rem',
              fontFamily: 'var(--font-heading)'
            }}>
              = {calculatedHours} hs
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción del Trabajo Realizado *</label>
            <textarea
              className="form-textarea"
              placeholder="Detalla las tareas realizadas durante ese horario en la obra (ej: de 13 a 15 hs revisión de cimientos y planos)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Horas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
