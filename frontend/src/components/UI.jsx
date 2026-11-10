import { AlertTriangle, Inbox, LoaderCircle, X } from 'lucide-react'

export function LoadingState({ label = 'Cargando información...' }) {
  return <div className="state-card"><LoaderCircle className="animate-spin text-amber-500" size={24} /><span>{label}</span></div>
}

export function EmptyState({ label = 'No hay información disponible', icon: Icon = Inbox }) {
  return <div className="state-card"><Icon className="text-slate-300" size={28} /><span>{label}</span></div>
}

export function ErrorState({ message = 'No fue posible cargar la información' }) {
  return <div className="state-card state-error"><AlertTriangle size={22} /><span>{message}</span></div>
}

export function StatusBadge({ value }) {
  const normalized = String(value || '').toLowerCase()
  const tone = normalized.includes('activa') || normalized.includes('aprobada') || normalized.includes('recibida') ? 'success' : normalized.includes('cancel') || normalized.includes('negativ') ? 'danger' : 'warning'
  return <span className={`status-badge ${tone}`}>{String(value || '—').replaceAll('_', ' ')}</span>
}

export function PageHeader({ eyebrow = 'Gestión de inventarios', title, description, action }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>
}

export function DataTable({ columns, rows, empty = 'No hay registros para mostrar' }) {
  if (!rows?.length) return <EmptyState label={empty} />
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>
}

export function Modal({ title, children, onClose, wide = false }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button modal-close" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div>{children}</section></div>
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, loading = false }) {
  return <Modal title={title} onClose={onCancel}><p className="confirm-message">{message}</p><div className="modal-actions"><button className="button secondary" onClick={onCancel} disabled={loading}>Cancelar</button><button className="button danger-button" onClick={onConfirm} disabled={loading}>{loading ? 'Eliminando...' : 'Confirmar eliminación'}</button></div></Modal>
}
