import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export default function ReceiptModal({ settlement, onClose }) {
  if (!settlement) return null;

  const { 
    user_name, 
    user_username, 
    rate_per_hour, 
    total_hours, 
    total_cost, 
    projects, 
    expenses = [], 
    total_expenses = 0, 
    period_start, 
    period_end 
  } = settlement;

  const grandTotal = total_cost + total_expenses;

  const formatPYG = (val) => '₲ ' + (Math.round(val || 0)).toLocaleString('es-PY');
  const todayStr = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const receiptNo = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(settlement.user_id).padStart(2, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '820px', width: '100%', padding: '2rem', background: '#FFF', color: '#000' }}
      >
        {/* Modal Controls (Hidden during print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
          <h3 style={{ color: '#0F172A', margin: 0 }}>🧾 Recibo de Pago de Honorarios & Reembolsos</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={16} /> Imprimir Recibo / Guardar PDF
            </button>
            <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ background: '#E2E8F0', color: '#0F172A' }}>
              Cerrar
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div id="printable-receipt" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '1rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#0F172A', color: '#EAB308', width: '42px', height: '42px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                  LA
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#0F172A', fontWeight: 800, letterSpacing: '-0.02em' }}>LOPEZ ARQ</h1>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', fontWeight: 500 }}>
                    Maru López & Asociados - Estudio de Arquitectura & Construcción
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ background: '#F1F5F9', color: '#0F172A', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-block' }}>
                {receiptNo}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginTop: '0.4rem' }}>
                Fecha de Emisión: <strong>{todayStr}</strong>
              </span>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', margin: '1.25rem 0' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, margin: 0 }}>
              RECIBO DE PAGO DE HONORARIOS Y REEMBOLSO DE GASTOS
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
              Período de Liquidación Semanal: {period_start} al {period_end} (Cierre Sábado)
            </span>
          </div>

          {/* Beneficiary Info */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Beneficiario / Proyectista</span>
                <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>{user_name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Tarifa Hora Acordada</span>
                <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>{formatPYG(rate_per_hour)} / hora</strong>
              </div>
            </div>
          </div>

          {/* SECTION 1: Itemized Hours Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#475569', marginBottom: '0.5rem', fontWeight: 700 }}>
              1. Detalle de Honorarios por Horas y Proyectos Trabados:
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#0F172A', color: '#FFF', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem', borderTopLeftRadius: '4px' }}>Obra / Proyecto</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Horas Trabajadas</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Tarifa (₲/hs)</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', borderTopRightRadius: '4px' }}>Subtotal (₲)</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: '#94A3B8' }}>
                      Sin registros de horas en este período.
                    </td>
                  </tr>
                ) : (
                  projects.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFF' : '#F8FAFC' }}>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: '#0F172A' }}>{p.project_name}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{p.hours.toFixed(1)} hs</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#475569' }}>{formatPYG(rate_per_hour)}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>{formatPYG(p.hours * rate_per_hour)}</td>
                    </tr>
                  ))
                )}
                <tr style={{ background: '#F1F5F9', fontWeight: 700 }}>
                  <td colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#0F172A' }}>Subtotal Honorarios por Horas:</td>
                  <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#0F172A' }}>{formatPYG(total_cost)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 2: Itemized Expenses / Reimbursements Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#475569', marginBottom: '0.5rem', fontWeight: 700 }}>
              2. Detalle de Reembolsos por Gastos Realizados (Oficina u Obras):
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#334155', color: '#FFF', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem', borderTopLeftRadius: '4px' }}>Fecha</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Destino / Proyecto</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Concepto / Detalle del Gasto</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', borderTopRightRadius: '4px' }}>Monto Aprobado (₲)</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: '#94A3B8' }}>
                      Sin gastos o reembolsos solicitados en este período.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFF' : '#F8FAFC' }}>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: '#475569' }}>{e.expense_date}</td>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0F172A' }}>
                        {e.category === 'PROJECT' ? `🏗️ ${e.project_name}` : '🏢 Oficina General'}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#334155' }}>{e.description}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>{formatPYG(e.amount)}</td>
                    </tr>
                  ))
                )}
                <tr style={{ background: '#F1F5F9', fontWeight: 700 }}>
                  <td colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#0F172A' }}>Subtotal Reembolso de Gastos:</td>
                  <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#0F172A' }}>{formatPYG(total_expenses)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Card */}
          <div style={{ background: '#0F172A', color: '#FFF', borderRadius: '8px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block' }}>
                HONORARIOS ({formatPYG(total_cost)}) + REEMBOLSOS ({formatPYG(total_expenses)})
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
                MONTO TOTAL GENERAL A PAGAR Y REEMBOLSAR:
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#EAB308', fontFamily: "'Outfit', sans-serif" }}>
              {formatPYG(grandTotal)}
            </div>
          </div>

          {/* Signature Blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3.5rem' }}>
            <div style={{ textAlign: 'center', borderTop: '1px solid #94A3B8', paddingTop: '0.75rem' }}>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0F172A' }}>Maru López</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Dirección General - Lopez Arq</span>
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px solid #94A3B8', paddingTop: '0.75rem' }}>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0F172A' }}>{user_name}</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Firma del Proyectista (Recibí Conforme)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
