import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Building2, Plus, Calendar, History, Edit2, Trash2, Filter, ArrowUpDown, RefreshCw } from 'lucide-react';
import NewTimesheetModal from './NewTimesheetModal';
import EditTimesheetModal from './EditTimesheetModal';

export default function ProyectistaDashboard({ token, user }) {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Range Filter (Default: Current week Monday to Saturday)
  const getWeekRange = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diffToMon)).toISOString().split('T')[0];
    const sat = new Date(d.setDate(diffToMon + 5)).toISOString().split('T')[0];
    return { mon, sat };
  };

  const initialWeek = getWeekRange();
  const [startDate, setStartDate] = useState(initialWeek.mon);
  const [endDate, setEndDate] = useState(initialWeek.sat);

  // Filters & Sorting state
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Modals state
  const [showNewTimesheetModal, setShowNewTimesheetModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState(null);

  const formatDateWithDay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayName = days[date.getDay()];
    return `${dayName} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  };

  const getDayBadge = (dateStr) => {
    if (!dateStr) return { bg: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'rgba(255,255,255,0.1)' };
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    const colors = [
      { bg: 'rgba(100, 116, 139, 0.25)', color: '#CBD5E1', border: 'rgba(148, 163, 184, 0.4)' }, // Dom
      { bg: 'rgba(59, 130, 246, 0.25)',  color: '#93C5FD', border: 'rgba(96, 165, 250, 0.4)' },  // Lun
      { bg: 'rgba(16, 185, 129, 0.25)',  color: '#6EE7B7', border: 'rgba(52, 211, 153, 0.4)' },  // Mar
      { bg: 'rgba(168, 85, 247, 0.25)',  color: '#E9D5FF', border: 'rgba(192, 132, 252, 0.4)' }, // Mié
      { bg: 'rgba(245, 158, 11, 0.25)',  color: '#FDE68A', border: 'rgba(251, 191, 36, 0.4)' },  // Jue
      { bg: 'rgba(236, 72, 153, 0.25)',  color: '#FBCFE8', border: 'rgba(244, 114, 182, 0.4)' }, // Vie
      { bg: 'rgba(234, 179, 8, 0.3)',    color: '#FEF08A', border: 'rgba(250, 204, 21, 0.5)' }   // Sáb
    ];
    return colors[day] || colors[0];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);

      const [resTimesheets, resProjects, resSummary] = await Promise.all([
        fetch('/api/timesheets', { headers }),
        fetch('/api/projects', { headers }),
        fetch(`/api/timesheets/summary?${queryParams.toString()}`, { headers })
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
  }, [startDate, endDate]);

  const handleDeleteTimesheet = async (id) => {
    if (!window.confirm('¿Desea eliminar este registro de horas cargado por error?')) return;
    setTimesheets(prev => prev.filter(t => t.id !== id));
    try {
      const res = await fetch(`/api/timesheets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const filteredTimesheetsByDate = useMemo(() => {
    return timesheets.filter((t) => {
      if (startDate && t.work_date < startDate) return false;
      if (endDate && t.work_date > endDate) return false;
      return true;
    });
  }, [timesheets, startDate, endDate]);

  const periodTotalHours = useMemo(() => {
    return filteredTimesheetsByDate.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
  }, [filteredTimesheetsByDate]);

  const lifetimeTotalHours = useMemo(() => {
    return timesheets.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
  }, [timesheets]);

  const processedTimesheets = useMemo(() => {
    return filteredTimesheetsByDate
      .filter((t) => {
        if (!selectedProjectFilter) return true;
        return String(t.project_id) === String(selectedProjectFilter);
      })
      .sort((a, b) => {
        if (sortBy === 'project') {
          return a.project_name.localeCompare(b.project_name);
        }
        if (sortBy === 'date_asc') {
          return new Date(a.work_date) - new Date(b.work_date);
        }
        return new Date(b.work_date) - new Date(a.work_date);
      });
  }, [filteredTimesheetsByDate, selectedProjectFilter, sortBy]);

  const handleSetThisWeek = () => {
    const range = getWeekRange();
    setStartDate(range.mon);
    setEndDate(range.sat);
  };

  const handleSetAllTime = () => {
    setStartDate('');
    setEndDate('');
  };

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
            Registra tus horas trabajadas indicando la hora de inicio y fin para cada proyecto.
          </p>
        </div>

        <button onClick={() => setShowNewTimesheetModal(true)} className="btn btn-primary">
          <Plus size={18} /> Cargar Nuevas Horas
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: 'var(--accent-blue)' }}>
          <div className="metric-icon" style={{ color: 'var(--accent-blue)' }}>
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Horas en el Período Seleccionado</span>
            <div className="value" style={{ color: 'var(--accent-blue)' }}>{periodTotalHours.toFixed(1)} hs</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-gold)' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Proyectos Trabajados/Visitadas</span>
            <div className="value">{summary?.by_project?.length || 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-emerald)' }}>
            <History size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Total Horas Histórico</span>
            <div className="value">{lifetimeTotalHours.toFixed(1)} hs</div>
          </div>
        </div>
      </div>

      {/* Date Range Selector Bar for Proyectista */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={18} style={{ color: 'var(--accent-gold)' }} />
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Filtrar Horas por Semana / Fecha:</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desde:</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hasta:</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                onClick={handleSetThisWeek} 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Esta Semana (Sábado)
              </button>
              <button 
                onClick={handleSetAllTime} 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Ver Todo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Hours per Project + Personal Timesheet History */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Acumulado por Obra / Proyecto */}
        <div className="card">
          <div className="card-title">
            <h3>🏗️ Horas Acumuladas por Proyecto</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {summary?.by_project?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no has registrado horas en ningún proyecto en este período.</p>
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horas en el período seleccionado</span>
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
            <li>Es obligatorio indicar la <strong>Hora de Inicio</strong> y <strong>Hora de fin de tu proyecto</strong> (ej: 13:00 a 15:00 hs).</li>
            <li>Si cargaste mal una hora, puedes modificarla con el botón ✏️ <strong>Editar</strong> o borrarla con 🗑️ <strong>Eliminar</strong>.</li>
          </ul>
        </div>
      </div>

      {/* Historial Detallado */}
      <div className="card">
        <div className="card-title" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <h2>📋 Mi Historial de Registros</h2>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                className="form-select"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
              >
                <option value="">Todos los Proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                className="form-select"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Orden: Más Recientes Primero</option>
                <option value="date_asc">Orden: Más Antiguos Primero</option>
                <option value="project">Ordenar por Nombre de Proyecto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Día / Fecha</th>
                <th>Obra / Proyecto</th>
                <th>Horario Trabajado</th>
                <th>Total Horas</th>
                <th>Descripción del Trabajo Realizado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {processedTimesheets.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros para las fechas o proyecto seleccionados.
                  </td>
                </tr>
              ) : (
                processedTimesheets.map((t) => {
                  const badge = getDayBadge(t.work_date);
                  return (
                    <tr key={t.id} style={{ borderLeft: `3px solid ${badge.color}` }}>
                      <td>
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'inline-block',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}>
                          📅 {formatDateWithDay(t.work_date)}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: 'rgba(255,255,255,0.08)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          color: 'var(--text-primary)'
                        }}>
                          {t.project_name}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                        🕒 {t.start_time || '08:00'} a {t.end_time || '12:00'} hs
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '1rem' }}>{t.hours} hs</td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.description}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setEditingTimesheet(t)}
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '0.4rem' }}
                          title="Editar esta carga de horas"
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTimesheet(t.id)}
                          className="btn btn-danger btn-sm"
                          title="Eliminar este registro cargado por error"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
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

      {editingTimesheet && (
        <EditTimesheetModal
          token={token}
          timesheet={editingTimesheet}
          projects={projects}
          onClose={() => setEditingTimesheet(null)}
          onSuccess={() => {
            setEditingTimesheet(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
