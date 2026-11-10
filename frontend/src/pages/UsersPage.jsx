import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search } from 'lucide-react'
import { apiClient } from '../services/api'
import { DataTable, ErrorState, LoadingState, Modal, PageHeader, StatusBadge } from '../components/UI'

const fields = [
  { name: 'identificacion', label: 'Identificación', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'correo', label: 'Correo electrónico', type: 'email', required: true },
  { name: 'rol', label: 'Rol', type: 'select', required: true, options: ['ADMINISTRADOR', 'ENCARGADO_BODEGA', 'SUPERVISOR_OBRA', 'CONSULTA'] },
]
const blank = { identificacion: '', nombre: '', correo: '', rol: 'CONSULTA' }

function UserForm({ value, readOnly, onSubmit, onClose, saving, error }) {
  const [form, setForm] = useState(value || blank); const [clientError, setClientError] = useState('')
  const submit = (event) => { event.preventDefault(); const missing = fields.find((field) => field.required && !String(form[field.name] || '').trim()); if (missing) return setClientError(`${missing.label} es obligatorio`); if (!readOnly && !form.password && !value?.id) return setClientError('La contraseña inicial es obligatoria'); if (!readOnly && form.password && form.password.length < 12) return setClientError('La contraseña debe tener al menos 12 caracteres'); setClientError(''); onSubmit(form) }
  return <form onSubmit={submit}><div className="form-grid">{fields.map((field) => <label className="form-field" key={field.name}><span>{field.label} *</span>{field.type === 'select' ? <select value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} disabled={readOnly}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type || 'text'} value={form[field.name] || ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} disabled={readOnly} />}</label>)}{!readOnly && <label className="form-field"><span>{value?.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *'}</span><input type="password" value={form.password || ''} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" /></label>}</div>{readOnly && <p className="page-description">Las credenciales nunca se muestran en la interfaz.</p>}{(clientError || error) && <div className="form-error">{clientError || error}</div>}<div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>{readOnly ? 'Cerrar' : 'Cancelar'}</button>{!readOnly && <button className="button primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar usuario'}</button>}</div></form>
}

export default function UsersPage() {
  const [rows, setRows] = useState(null); const [query, setQuery] = useState(''); const [modal, setModal] = useState(null); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  const load = () => apiClient.get('/usuarios').then(setRows).catch((err) => setError(err.message))
  useEffect(() => { load() }, [])
  const filtered = useMemo(() => (rows || []).filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query.toLowerCase()))), [rows, query])
  const save = (body) => { setSaving(true); const action = modal.mode === 'edit' ? apiClient.put(`/usuarios/${modal.row.id}`, body) : apiClient.post('/usuarios', body); action.then(() => { setModal(null); load() }).catch((err) => setError(err.message)).finally(() => setSaving(false)) }
  return <><PageHeader title="Usuarios" description="Responsables disponibles para registrar movimientos y trazabilidad." action={<button className="button primary" onClick={() => setModal({ mode: 'create', row: blank })}><Plus size={17} /> Nuevo usuario</button>} /><div className="panel"><div className="panel-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario..." /></div><span>{rows ? `${filtered.length} de ${rows.length} registros` : 'Consultando API...'}</span></div>{error && !rows ? <ErrorState message={error} /> : rows ? <DataTable rows={filtered} columns={[{ key: 'identificacion', label: 'Identificación' }, { key: 'nombre', label: 'Nombre' }, { key: 'correo', label: 'Correo' }, { key: 'rol', label: 'Rol', render: (row) => <StatusBadge value={row.rol} /> }, { key: 'activo', label: 'Estado', render: (row) => <StatusBadge value={row.activo ? 'ACTIVO' : 'INACTIVO'} /> }, { key: 'actions', label: 'Acciones', render: (row) => <div className="row-actions"><button className="table-action" title="Ver" onClick={() => setModal({ mode: 'view', row })}><Eye size={16} /></button><button className="table-action" title="Editar" onClick={() => setModal({ mode: 'edit', row })}><Pencil size={16} /></button></div> }]} empty="No hay usuarios registrados" /> : <LoadingState />}</div>{modal && <Modal title={`${modal.mode === 'create' ? 'Nuevo' : modal.mode === 'edit' ? 'Editar' : 'Detalle'} usuario`} onClose={() => !saving && setModal(null)}><UserForm value={modal.row} readOnly={modal.mode === 'view'} onSubmit={save} onClose={() => setModal(null)} saving={saving} error={error && rows ? error : ''} /></Modal>}</>
}
