import React, { useState } from 'react';
import { DollarSign, Building2, Calendar, FileText, X } from 'lucide-react';

export default function NewExpenseModal({ token, projects, expenseToEdit, onClose, onSuccess }) {
  const [category, setCategory] = useState(expenseToEdit?.category || 'OFFICE'); // 'OFFICE' | 'PROJECT'
  const [projectId, setProjectId] = useState(expenseToEdit?.project_id || '');
  const [expenseDate, setExpenseDate] = useState(expenseToEdit?.expense_date || new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(expenseToEdit?.amount || '');
  const [description, setDescription] = useState(expenseToEdit?.description || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!expenseDate) return setError('La fecha del gasto es obligatoria.');
    if (!amount || parseFloat(amount) <= 0) return setError('Ingrese un monto válido en Guaraníes.');
    if (category === 'PROJECT' && !projectId) return setError('Seleccione el proyecto u obra al que corresponde este gasto.');
    if (!description.trim()) return setError('Ingrese el concepto o descripción del gasto.');

    setLoading(true);

    try {
      const url = expenseToEdit ? `/api/expenses/${expenseToEdit.id}` : '/api/expenses';
      const method = expenseToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          project_id: category === 'PROJECT' ? projectId : null,
          expense_date: expenseDate,
          amount: parseFloat(amount),
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el gasto');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3>💸 {expenseToEdit ? 'Editar Gasto / Reembolso' : 'Cargar Gasto / Reembolso'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Destino del gasto: Oficina General vs Proyecto */}
          <div className="form-group">
            <label className="form-label">Destino del Gasto</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className={`btn ${category === 'OFFICE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
                onClick={() => setCategory('OFFICE')}
              >
                🏢 Oficina General
              </button>
              <button
                type="button"
                className={`btn ${category === 'PROJECT' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
                onClick={() => setCategory('PROJECT')}
              >
                🏗️ Proyecto / Obra
              </button>
            </div>
          </div>

          {/* Project dropdown if category is PROJECT */}
          {category === 'PROJECT' && (
            <div className="form-group">
              <label className="form-label">Obra / Proyecto Relacionado *</label>
              <select
                className="form-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">-- Seleccionar Obra --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha del Gasto *</label>
              <input
                type="date"
                className="form-input"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monto (₲ Guaraníes) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej: 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Concepto / Detalle del Gasto *</label>
            <textarea
              className="form-textarea"
              placeholder="Ej: Impresión de planos A1, Compra de carpetas de oficina, Pasaje / Taxi a obra..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows="3"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (expenseToEdit ? 'Guardar Cambios' : 'Registrar Gasto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
