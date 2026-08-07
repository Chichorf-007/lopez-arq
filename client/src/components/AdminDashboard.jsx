import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DollarSign, Clock, Building2, Users, Plus, Filter, Printer, Edit2, Trash2, Search, Calendar, RefreshCw, FileText, CheckCircle2 
} from 'lucide-react';
import EditProyectistaModal from './EditProyectistaModal';
import NewProjectModal from './NewProjectModal';
import NewTimesheetModal from './NewTimesheetModal';
import EditTimesheetModal from './EditTimesheetModal';
import ReceiptModal from './ReceiptModal';

export default function AdminDashboard({ token, user }) {
  const [activeTab, setActiveTab] = useState('settlement');
  
  const [timesheets, setTimesheets] = useState([]);
  const [proyectistas, setProyectistas] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Weekly Saturday settlement date range (Default: Monday to Saturday of current week)
  const getWeekRange = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diffToMon)).toISOString().split('T')[0];
    const sat = new Date(d.setDate(diffToMon + 5)).toISOString().split('T')[0];
    return { mon, sat };
  };

  const initialWeek = getWeekRange();
  const [settlementStart, setSettlementStart] = useState(initialWeek.mon);
  const [settlementEnd, setSettlementEnd] = useState(initialWeek.sat);

  // Filters state for general timesheets tab
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProyectista, setSelectedProyectista] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editingProyectista, setEditingProyectista] = useState(null);
  const [editingTimesheet, setEditingTimesheet] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showNewProyectistaModal, setShowNewProyectistaModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTimesheetModal, setShowNewTimesheetModal] = useState(false);

  const formatPYG = (val) => '₲ ' + (Math.round(val || 0)).toLocaleString('es-PY');

  const formatDateWithDay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayName = days[date.getDay()];
    return `${dayName} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  };

  const getDayColor = (dateStr) => {
    if (!dateStr) return { bg: 'rgba(255,255,255,0.05)', color: '#FFF' };
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    const colors = [
      { bg: 'rgba(100, 116, 139, 0.2)', color: '#94A3B8' }, // Dom
      { bg: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' },  // Lun
      { bg: 'rgba(16, 185, 129, 0.2)', color: '#34D399' },  // Mar
      { bg: 'rgba(168, 85, 247, 0.2)', color: '#C084FC' },  // Mié
      { bg: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' },  // Jue
      { bg: 'rgba(236, 72, 153, 0.2)', color: '#F472B6' },  // Vie
      { bg: 'rgba(234, 179, 8, 0.25)', color: '#FACC15' }   // Sáb
    ];
    return colors[day] || colors[0];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      if (selectedProject) queryParams.append('project_id', selectedProject);
      if (selectedProyectista) queryParams.append('user_id', selectedProyectista);

      const [resTimesheets, resProyectistas, resProjects, resSummary] = await Promise.all([
        fetch(`/api/timesheets?${queryParams.toString()}`, { headers }),
        fetch('/api/proyectistas', { headers }),
        fetch('/api/projects', { headers }),
        fetch(`/api/timesheets/summary?${queryParams.toString()}`, { headers })
      ]);

      if (resTimesheets.ok) setTimesheets(await resTimesheets.json());
      if (resProyectistas.ok) setProyectistas(await resProyectistas.json());
      if (resProjects.ok) setProjects(await resProjects.json());
      if (resSummary.ok) setSummary(await resSummary.json());
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate, selectedProject, selectedProyectista]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute Weekly Saturday Settlement per Proyectista
  const weeklySettlements = useMemo(() => {
    if (!proyectistas.length || !timesheets.length) return [];

    const weekTimesheets = timesheets.filter((t) => {
      if (settlementStart && t.work_date < settlementStart) return false;
      if (settlementEnd && t.work_date > settlementEnd) return false;
      return true;
    });

    return proyectistas.map((p) => {
      const pTimesheets = weekTimesheets.filter((t) => String(t.user_id) === String(p.id));
      const rate = p.rate_per_hour || 0;

      const projMap = {};
      let totalHours = 0;

      pTimesheets.forEach((t) => {
        const h = parseFloat(t.hours) || 0;
        totalHours += h;
        if (!projMap[t.project_id]) {
          projMap[t.project_id] = { project_id: t.project_id, project_name: t.project_name, hours: 0 };
        }
        projMap[t.project_id].hours += h;
      });

      const totalCost = totalHours * rate;

      return {
        user_id: p.id,
        user_name: p.name,
        user_username: p.username,
        rate_per_hour: rate,
        total_hours: totalHours,
        total_cost: totalCost,
        projects: Object.values(projMap),
        period_start: settlementStart,
        period_end: settlementEnd
      };
    });
  }, [proyectistas, timesheets, settlementStart, settlementEnd]);

  const totalWeeklyPayroll = useMemo(() => {
    return weeklySettlements.reduce((sum, s) => sum + s.total_cost, 0);
  }, [weeklySettlements]);

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

  const handlePrint = () => {
    window.print();
  };

  const filteredTimesheets = timesheets.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.user_name.toLowerCase().includes(term) ||
      t.project_name.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Top Banner / Metrics */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: 'var(--accent-gold)' }}>
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Nómina a Pagar este Sábado</span>
            <div className="value" style={{ color: 'var(--accent-gold)' }}>{formatPYG(totalWeeklyPayroll)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-blue)' }}>
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Total Horas Registradas</span>
            <div className="value">{(summary?.total_hours || 0).toFixed(1)} hs</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-emerald)' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Proyectos / Obras en ejecución</span>
            <div className="value">{projects.filter(p => p.status === 'ACTIVE').length}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#A855F7' }}>
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Proyectistas Activos</span>
            <div className="value">{proyectistas.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="tabs-header no-print">
        <button
          className={`tab-btn ${activeTab === 'settlement' ? 'active' : ''}`}
          onClick={() => setActiveTab('settlement')}
        >
          💵 Cierre Semanal de Pagos y Recibos (Sábados)
        </button>
        <button
          className={`tab-btn ${activeTab === 'timesheets' ? 'active' : ''}`}
          onClick={() => setActiveTab('timesheets')}
        >
          ⏱️ Reporte General de Horas y Horarios
        </button>
        <button
          className={`tab-btn ${activeTab === 'proyectistas' ? 'active' : ''}`}
          onClick={() => setActiveTab('proyectistas')}
        >
          👥 Gestión de Proyectistas y Tarifas (₲)
        </button>
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          🏛️ Proyectos / Obras en ejecución
        </button>
      </div>

      {/* TAB 0: TABLA DE CIERRE SEMANAL Y EMISIÓN DE RECIBOS */}
      {activeTab === 'settlement' && (
        <div className="card">
          <div className="card-title no-print" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2>🗓️ Cierre de Pagos Semanales (Sábado Mediodía)</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Resumen de cuánto estás pagando a cada proyectista esta semana con desglose por obra y generador de recibos oficiales.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-input)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Desde (Lunes)</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
                  value={settlementStart}
                  onChange={(e) => setSettlementStart(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Hasta (Sábado)</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
                  value={settlementEnd}
                  onChange={(e) => setSettlementEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
            {weeklySettlements.map((s) => (
              <div 
                key={s.user_id} 
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'block' }}>{s.user_name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{s.user_username}</span>
                    </div>
                    <span style={{ background: 'rgba(234,179,8,0.15)', color: 'var(--accent-gold)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      Tarifa: {formatPYG(s.rate_per_hour)}/hs
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', margin: '0.75rem 0' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      Detalle de Proyectos en la Semana:
                    </span>
                    {s.projects.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin horas registradas en esta semana.</span>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                        {s.projects.map((p) => (
                          <li key={p.project_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-primary)' }}>• {p.project_name}</span>
                            <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                              {p.hours.toFixed(1)} hs ({formatPYG(p.hours * s.rate_per_hour)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL HORAS: {s.total_hours.toFixed(1)} hs</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>A PAGAR EL SÁBADO:</span>
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)' }}>
                      {formatPYG(s.total_cost)}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedReceipt(s)}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    disabled={s.total_hours === 0}
                  >
                    <FileText size={16} /> 🧾 Generar Recibo de Pago Imprimible
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: General Timesheets / Horas */}
      {activeTab === 'timesheets' && (
        <div className="card">
          <div className="card-title no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2>Registros de Horas, Horarios y Costos</h2>
              <button 
                onClick={fetchData} 
                className="btn btn-secondary btn-sm" 
                title="Actualizar datos al instante"
                style={{ padding: '0.3rem 0.6rem' }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualizar
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handlePrint} className="btn btn-secondary btn-sm">
                <Printer size={16} /> Imprimir / PDF
              </button>
              <button onClick={() => setShowNewTimesheetModal(true)} className="btn btn-primary btn-sm">
                <Plus size={16} /> Cargar Horas
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="no-print" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            background: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Filtrar Proyecto/Obra</label>
              <select
                className="form-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Todos los proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Filtrar Proyectista</label>
              <select
                className="form-select"
                value={selectedProyectista}
                onChange={(e) => setSelectedProyectista(e.target.value)}
              >
                <option value="">Todos los proyectistas</option>
                {proyectistas.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Buscar palabra</label>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Día / Fecha</th>
                  <th>Proyectista</th>
                  <th>Proyecto / Obra</th>
                  <th>Horario (Inicio - Fin)</th>
                  <th>Total Horas</th>
                  <th>Tarifa (₲/hs)</th>
                  <th>Costo Total (₲)</th>
                  <th>Descripción del Trabajo</th>
                  <th className="no-print">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se encontraron registros de horas para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredTimesheets.map((t) => {
                    const dayStyle = getDayColor(t.work_date);
                    return (
                      <tr key={t.id}>
                        <td>
                          <span style={{
                            background: dayStyle.bg,
                            color: dayStyle.color,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'inline-block',
                            border: `1px solid ${dayStyle.color}40`
                          }}>
                            📅 {formatDateWithDay(t.work_date)}
                          </span>
                        </td>
                        <td>{t.user_name}</td>
                        <td>
                          <span style={{ 
                            background: 'rgba(255,255,255,0.06)', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px', 
                            fontWeight: 500 
                          }}>
                            {t.project_name}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                          🕒 {t.start_time || '08:00'} a {t.end_time || '12:00'} hs
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{t.hours} hs</td>
                        <td>{formatPYG(t.rate_per_hour)}</td>
                        <td className="currency-badge">{formatPYG(t.total_cost)}</td>
                        <td style={{ maxWidth: '280px', fontSize: '0.85rem' }}>{t.description}</td>
                        <td className="no-print" style={{ whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => setEditingTimesheet(t)}
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '0.4rem' }}
                            title="Editar registro"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTimesheet(t.id)}
                            className="btn btn-danger btn-sm"
                            title="Eliminar registro (Solo Admin)"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* TAB 2: Proyectistas */}
      {activeTab === 'proyectistas' && (
        <div className="card">
          <div className="card-title">
            <h2>Proyectistas y Tarifas en Guaraníes (₲)</h2>
            <button onClick={() => setShowNewProyectistaModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Crear Proyectista
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Aquí puedes editar los nombres completos y usuarios de acceso en formato <strong>nombre.apellido</strong>, definir las tarifas por hora en Guaraníes (₲) y cambiar sus contraseñas.
          </p>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre Visible</th>
                  <th>Usuario (nombre.apellido)</th>
                  <th>Tarifa por Hora (₲/hs)</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proyectistas.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>@{p.username}</td>
                    <td className="currency-badge" style={{ fontSize: '1.05rem' }}>
                      {formatPYG(p.rate_per_hour)} / hs
                    </td>
                    <td>
                      <span className="role-pill proyectista" style={{ display: 'inline-flex' }}>
                        Activo
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setEditingProyectista(p)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit2 size={14} /> Editar Nombre / Usuario / Tarifa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Projects */}
      {activeTab === 'projects' && (
        <div className="card">
          <div className="card-title">
            <h2>Proyectos / Obras en ejecución (Con Detalle de Trabajos)</h2>
            <button onClick={() => setShowNewProjectModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Nueva Obra
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre de la Obra</th>
                  <th>Descripción del Proyecto</th>
                  <th>Trabajos y Tareas Cargadas por Proyectistas</th>
                  <th>Total Horas</th>
                  <th>Costo Acumulado (₲)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => {
                  const projSummary = summary?.by_project?.find((bp) => bp.project_id === proj.id);
                  const projTimesheets = timesheets.filter((t) => t.project_id === proj.id);

                  return (
                    <tr key={proj.id}>
                      <td style={{ fontWeight: 700, fontSize: '1rem', verticalAlign: 'top' }}>{proj.name}</td>
                      <td style={{ color: 'var(--text-primary)', maxWidth: '250px', verticalAlign: 'top', fontSize: '0.9rem' }}>
                        <strong>{proj.description || 'Sin descripción principal'}</strong>
                      </td>
                      <td style={{ maxWidth: '350px', verticalAlign: 'top', fontSize: '0.85rem' }}>
                        {projTimesheets.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)' }}>Sin avances cargados aún.</span>
                        ) : (
                          <ul style={{ paddingLeft: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {projTimesheets.slice(0, 4).map((t) => (
                              <li key={t.id}>
                                <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{t.user_name}</span>: {t.description} ({t.hours} hs)
                              </li>
                            ))}
                            {projTimesheets.length > 4 && (
                              <li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                + {projTimesheets.length - 4} tareas más...
                              </li>
                            )}
                          </ul>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-blue)', verticalAlign: 'top' }}>
                        {(projSummary?.hours || 0).toFixed(1)} hs
                      </td>
                      <td className="currency-badge" style={{ verticalAlign: 'top' }}>
                        {formatPYG(projSummary?.cost || 0)}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--accent-emerald)',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {proj.status === 'ACTIVE' ? 'En Ejecución' : 'Completado'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedReceipt && (
        <ReceiptModal
          settlement={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {editingProyectista && (
        <EditProyectistaModal
          token={token}
          proyectista={editingProyectista}
          onClose={() => setEditingProyectista(null)}
          onSuccess={() => {
            setEditingProyectista(null);
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

      {showNewProyectistaModal && (
        <EditProyectistaModal
          token={token}
          proyectista={null}
          onClose={() => setShowNewProyectistaModal(false)}
          onSuccess={() => {
            setShowNewProyectistaModal(false);
            fetchData();
          }}
        />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          token={token}
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={() => {
            setShowNewProjectModal(false);
            fetchData();
          }}
        />
      )}

      {showNewTimesheetModal && (
        <NewTimesheetModal
          token={token}
          user={user}
          projects={projects}
          proyectistas={proyectistas}
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
