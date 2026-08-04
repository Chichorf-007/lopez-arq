import React, { useState, useEffect } from 'react';
import { Clock, Building2, Plus, Calendar, CheckCircle2, History } from 'lucide-react';
import NewTimesheetModal from './NewTimesheetModal';

export default function ProyectistaDashboard({ token, user }) {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewTimesheetModal, setShowNewTimesheetModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resTimesheets, resProjects, resSummary] = await Promise.all([
        fetch('/api/timesheets', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/timesheets/summary', { headers })
      ]);

      if (resTimesheets.ok) setTimesheets(await resTimesheets.json());
      if (resProjects.ok) setProjects(await resProjects.json());
      if (resSummary.ok) setSummary(await resSummary.json());
    } catch (err) {
      console.error('Error al cargar datos del proyectista:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {/* Top Welcome & Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Hola, {user.name} 👋</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Registra tus horas trabajadas indicando el horario de inicio y fin para cada obra.
          </p>
        </div>

        <button onClick={() => setShowNewTimesheetModal(true)} className="btn btn-primary">
          <Plus size={18} /> Cargar Nuevas Horas
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-blue)' }}>
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Total Horas Acumuladas</span>
            <div className="value">{(summary?.total_hours || 0).toFixed(1)} hs</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-gold)' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Obras Trabajadas / Visitadas</span>
            <div className="value">{summary?.by_project?.length || 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-emerald)' }}>
            <History size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Registros Realizados</span>
            <div className="value">{timesheets.length}</div>
          </div>
        </div>
      </div>

      {/* Grid: Hours per Project + Personal Timesheet History */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Acumulado por Obra */}
        <div className="card">
          <div className="card-title">
            <h3>🏗️ Horas Acumuladas por Obra</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {summary?.by_project?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no has registrado horas en ninguna obra.</p>
            ) : (
              summary?.by_project?.map((p) => (
                <div key={p.project_id} style={{
                  background: 'var(--bg-input)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}>{p.project_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horas acumuladas en esta obra</span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.2rem 0.75rem',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {p.hours.toFixed(1)} hs
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Carga Rápida Info */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(21,28,44,1) 0%, rgba(15,23,42,1) 100%)' }}>
          <div className="card-title">
            <h3>ℹ️ Control Obligatorio de Horarios</h3>
          </div>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li>Es obligatorio indicar la <strong>Hora de Inicio</strong> y <strong>Hora de Fin</strong> de tu jornada (ej: 13:00 a 15:00 hs).</li>
            <li>El sistema calculará automáticamente la cantidad total de horas transcurridas.</li>
            <li>Describe detalladamente el trabajo y fiscalización realizada durante dicho intervalo.</li>
          </ul>
        </div>
      </div>

      {/* Historial Detallado */}
      <div className="card">
        <div className="card-title">
          <h2>📋 Mi Historial de Registros y Horarios</h2>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Obra / Proyecto</th>
                <th>Horario Trabajado</th>
                <th>Total Horas</th>
                <th>Descripción del Trabajo Realizado</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aún no tienes registros de horas guardados. ¡Haz clic en "Cargar Nuevas Horas"!
                  </td>
                </tr>
              ) : (
                timesheets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.work_date}</td>
                    <td>
                      <span style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {t.project_name}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                      🕒 {t.start_time || '08:00'} a {t.end_time || '12:00'} hs
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{t.hours} hs</td>
                    <td style={{ fontSize: '0.9rem' }}>{t.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cargar Horas */}
      {showNewTimesheetModal && (
        <NewTimesheetModal
          token={token}
          user={user}
          projects={projects}
          onClose={() => setShowNewTimesheetModal(false)}
          onSuccess={() => {
            setShowNewTimesheetModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
