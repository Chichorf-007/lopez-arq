import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, Clock, Building2, Users, Plus, Filter, Printer, Edit2, Trash2, Search, Calendar, RefreshCw 
} from 'lucide-react';
import EditProyectistaModal from './EditProyectistaModal';
import NewProjectModal from './NewProjectModal';
import NewTimesheetModal from './NewTimesheetModal';
import EditTimesheetModal from './EditTimesheetModal';

export default function AdminDashboard({ token, user }) {
  const [activeTab, setActiveTab] = useState('timesheets');
  
  const [timesheets, setTimesheets] = useState([]);
  const [proyectistas, setProyectistas] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProyectista, setSelectedProyectista] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editingProyectista, setEditingProyectista] = useState(null);
  const [editingTimesheet, setEditingTimesheet] = useState(null);
  const [showNewProyectistaModal, setShowNewProyectistaModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTimesheetModal, setShowNewTimesheetModal] = useState(false);

  const formatPYG = (val) => '₲ ' + (Math.round(val || 0)).toLocaleString('es-PY');

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

  const handleDeleteTimesheet = async (id) => {
    if (!window.confirm('¿Desea eliminar este registro de horas?')) return;
    
    // Instant optimistic update
    setTimesheets(prev => prev.filter(t => t.id !== id));
    
    try {
      const res = await fetch(`/api/timesheets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
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
        <div className="metric-card">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Total Inversión (Guaraníes)</span>
            <div className="value">{formatPYG(summary?.total_cost)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-blue)' }}>
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Total Horas Trabajadas</span>
            <div className="value">{(summary?.total_hours || 0).toFixed(1)} hs</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-emerald)' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Obras en Curso</span>
            <div className="value">{projects.filter(p => p.status === 'ACTIVE').length}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#A855F7' }}>
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="label">Proyectistas</span>
            <div className="value">{proyectistas.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="tabs-header no-print">
        <button
          className={`tab-btn ${activeTab === 'timesheets' ? 'active' : ''}`}
          onClick={() => setActiveTab('timesheets')}
        >
          ⏱️ Reporte Semanal y Horarios
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
          🏛️ Obras y Proyectos Activos
        </button>
      </div>

      {/* TAB 1: Timesheets / Horas */}
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
              <label className="form-label">Filtrar Obra</label>
              <select
                className="form-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Todas las obras</option>
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
                  <th>Fecha</th>
                  <th>Proyectista</th>
                  <th>Obra / Proyecto</th>
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
                  filteredTimesheets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.work_date}</td>
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
                  ))
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

      {/* TAB 3: Projects - CON DESCRIPCIONES DE LA OBRA Y DE LAS TAREAS REALIZADAS */}
      {activeTab === 'projects' && (
        <div className="card">
          <div className="card-title">
            <h2>Obras y Proyectos Activos (Con Detalle de Trabajos)</h2>
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
                  // Find all recent timesheet task descriptions for this project
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
