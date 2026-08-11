import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Building2, Plus, Calendar, History, Edit2, Trash2, Filter, ArrowUpDown, RefreshCw, DollarSign, Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import NewTimesheetModal from './NewTimesheetModal';
import EditTimesheetModal from './EditTimesheetModal';
import NewExpenseModal from './NewExpenseModal';

export default function ProyectistaDashboard({ token, user }) {
  const [activeSubTab, setActiveSubTab] = useState('timesheets'); // 'timesheets' | 'expenses'
  
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
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
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const formatPYG = (val) => '₲ ' + (Math.round(val || 0)).toLocaleString('es-PY');

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

      const [resTimesheets, resProjects, resSummary, resExpenses] = await Promise.all([
        fetch('/api/timesheets', { headers }),
        fetch('/api/projects', { headers }),
        fetch(`/api/timesheets/summary?${queryParams.toString()}`, { headers }),
        fetch('/api/expenses', { headers })
      ]);

      if (resTimesheets.ok) setTimesheets(await resTimesheets.json());
      if (resProjects.ok) setProjects(await resProjects.json());
      if (resSummary.ok) setSummary(await resSummary.json());
      if (resExpenses.ok) setExpenses(await resExpenses.json());
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
    if (!window.confirm('¿Desea eliminar este registro de horas?')) return;
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

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('¿Desea eliminar este registro de gasto?')) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      const res = await fetch(`/api/expenses/${id}`, {
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

  const filteredExpensesByDate = useMemo(() => {
    return expenses.filter((e) => {
      if (startDate && e.expense_date < startDate) return false;
      if (endDate && e.expense_date > endDate) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  const periodTotalHours = useMemo(() => {
    return filteredTimesheetsByDate.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
  }, [filteredTimesheetsByDate]);

  const periodTotalExpenses = useMemo(() => {
    return filteredExpensesByDate.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [filteredExpensesByDate]);

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
            Registra tus horas trabajadas y tus gastos de oficina u obras para solicitar reembolso.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowNewTimesheetModal(true)} className="btn btn-primary">
            <Plus size={18} /> Cargar Horas
          </button>
          <button onClick={() => { setEditingExpense(null); setShowNewExpenseModal(true); }} className="btn btn-secondary" style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-gold)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <DollarSign size={18} /> 💸 Cargar Gasto / Reembolso
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: 'var(--accent-blue)' }}>
          <div className="metric-icon" style={{ color: 'var(--accent-blue)' }}>
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Horas en el Período</span>
            <div className="value" style={{ color: 'var(--accent-blue)' }}>{periodTotalHours.toFixed(1)} hs</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: 'var(--accent-gold)' }}>
          <div className="metric-icon" style={{ color: 'var(--accent-gold)' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Gastos / Reembolsos en el Período</span>
            <div className="value" style={{ color: 'var(--accent-gold)' }}>{formatPYG(periodTotalExpenses)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-emerald)' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Proyectos Trabajados</span>
            <div className="value">{summary?.by_project?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={18} style={{ color: 'var(--accent-gold)' }} />
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Filtrar por Semana / Fecha:</strong>
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

      {/* Tabs Switcher: Horas vs Gastos */}
      <div className="tabs-header" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeSubTab === 'timesheets' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('timesheets')}
        >
          ⏱️ Mi Historial de Horas
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('expenses')}
        >
          💸 Mis Gastos y Reembolsos (Oficina u Obras)
        </button>
      </div>

      {/* SECTION 1: TIMESHEETS TAB */}
      {activeSubTab === 'timesheets' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <div className="card-title">
                <h3>🏗️ Horas Acumuladas por Proyecto</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {summary?.by_project?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin horas registradas en este período.</p>
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

            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(21,28,44,1) 0%, rgba(15,23,42,1) 100%)' }}>
              <div className="card-title">
                <h3>ℹ️ Control de Horas & Gastos</h3>
              </div>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li>Indica <strong>Hora de Inicio</strong> y <strong>Hora de Fin</strong> al registrar tus trabajos.</li>
                <li>Si hiciste un gasto personal para la oficina o una obra (planos, papelería, combustible), cárgalo en <strong>"💸 Cargar Gasto"</strong>.</li>
                <li>Maru te devolverá los gastos aprobados junto con tu pago el día **Sábado**.</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h2>📋 Mi Historial de Registros de Horas</h2>
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
                        No se encontraron registros para las fechas seleccionadas.
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
                              display: 'inline-block'
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
                            <button onClick={() => setEditingTimesheet(t)} className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }}>
                              <Edit2 size={14} /> Editar
                            </button>
                            <button onClick={() => handleDeleteTimesheet(t.id)} className="btn btn-danger btn-sm">
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
        </>
      )}

      {/* SECTION 2: EXPENSES TAB */}
      {activeSubTab === 'expenses' && (
        <div className="card">
          <div className="card-title">
            <h2>💸 Mis Gastos y Reembolsos Solicitados</h2>
            <button onClick={() => { setEditingExpense(null); setShowNewExpenseModal(true); }} className="btn btn-primary btn-sm">
              <Plus size={16} /> Cargar Gasto
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Aquí puedes registrar las compras o insumos abonados con tu dinero para la <strong>Oficina</strong> o para <strong>Obras</strong>. Al realizar el cierre de nómina del Sábado, Maru te los devolverá junto a tu pago.
          </p>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Destino / Proyecto</th>
                  <th>Monto Solicitado (₲)</th>
                  <th>Concepto / Detalle del Gasto</th>
                  <th>Estado Reembolso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpensesByDate.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No tienes gastos o reembolsos registrados en este período.
                    </td>
                  </tr>
                ) : (
                  filteredExpensesByDate.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.expense_date}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          background: e.category === 'PROJECT' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          color: e.category === 'PROJECT' ? 'var(--accent-blue)' : '#C084FC'
                        }}>
                          {e.category === 'PROJECT' ? `🏗️ ${e.project_name}` : '🏢 Oficina General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.05rem' }}>
                        {formatPYG(e.amount)}
                      </td>
                      <td style={{ fontSize: '0.9rem' }}>{e.description}</td>
                      <td>
                        {e.status === 'REIMBURSED' ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                            ✓ Reembolsado
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-gold)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                            ⏳ Pendiente Sábado
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button onClick={() => { setEditingExpense(e); setShowNewExpenseModal(true); }} className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }}>
                          <Edit2 size={14} /> Editar
                        </button>
                        <button onClick={() => handleDeleteExpense(e.id)} className="btn btn-danger btn-sm">
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {showNewExpenseModal && (
        <NewExpenseModal
          token={token}
          projects={projects}
          expenseToEdit={editingExpense}
          onClose={() => setShowNewExpenseModal(false)}
          onSuccess={() => {
            setShowNewExpenseModal(false);
            setEditingExpense(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
