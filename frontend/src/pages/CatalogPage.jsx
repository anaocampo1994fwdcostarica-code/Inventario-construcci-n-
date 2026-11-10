import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { apiClient } from '../services/api'
import { ConfirmDialog, DataTable, ErrorState, LoadingState, Modal, PageHeader, StatusBadge } from '../components/UI'

const configs = {
  materiales: {
    title: 'Materiales', description: 'Catálogo de insumos y parámetros de reposición.', endpoint: '/materiales', singular: 'material',
    fields: [
      { name: 'codigo', label: 'Código', required: true }, { name: 'nombre', label: 'Nombre', required: true }, { name: 'descripcion', label: 'Descripción', type: 'textarea' }, { name: 'unidadMedida', label: 'Unidad de medida', required: true },
      { name: 'stockMinimo', label: 'Stock mínimo', type: 'number', required: true, min: 0 }, { name: 'stockMaximo', label: 'Stock máximo', type: 'number', required: true, min: 0 }, { name: 'demandaDiariaPromedio', label: 'Demanda diaria promedio', type: 'number', required: true, min: 0 }, { name: 'demandaDiariaMaxima', label: 'Demanda diaria máxima', type: 'number', required: true, min: 0 }, { name: 'tiempoEntregaDias', label: 'Tiempo de entrega (días)', type: 'number', required: true, min: 0 },
    ],
    columns: [{ key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Material' }, { key: 'unidadMedida', label: 'Unidad' }, { key: 'stockMinimo', label: 'Stock mínimo' }, { key: 'stockMaximo', label: 'Stock máximo' }],
  },
  ubicaciones: {
    title: 'Ubicaciones', description: 'Bodegas y obras donde se gestiona el inventario.', endpoint: '/ubicaciones', singular: 'ubicación',
    fields: [{ name: 'codigo', label: 'Código', required: true }, { name: 'nombre', label: 'Nombre', required: true }, { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: ['BODEGA', 'OBRA'] }, { name: 'direccion', label: 'Dirección' }],
    columns: [{ key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' }, { key: 'tipo', label: 'Tipo', render: (row) => <StatusBadge value={row.tipo} /> }, { key: 'direccion', label: 'Dirección' }],
  },
  proveedores: {
    title: 'Proveedores', description: 'Directorio de proveedores de materiales.', endpoint: '/proveedores', singular: 'proveedor',
    fields: [{ name: 'identificacion', label: 'Identificación', required: true }, { name: 'nombre', label: 'Nombre', required: true }, { name: 'correo', label: 'Correo electrónico', type: 'email' }, { name: 'telefono', label: 'Teléfono' }, { name: 'direccion', label: 'Dirección' }],
    columns: [{ key: 'identificacion', label: 'Identificación' }, { key: 'nombre', label: 'Proveedor' }, { key: 'correo', label: 'Correo' }, { key: 'telefono', label: 'Teléfono' }],
  },
}

const emptyForm = (fields) => Object.fromEntries(fields.map((field) => [field.name, '']))

function CatalogForm({ config, value, mode, onSubmit, onClose, saving, error }) {
  const [form, setForm] = useState(value || emptyForm(config.fields)); const [clientError, setClientError] = useState('')
  const readOnly = mode === 'view'
  const change = (name, next) => setForm((current) => ({ ...current, [name]: next }))
  const submit = (event) => {
    event.preventDefault(); if (readOnly) return onClose()
    const required = config.fields.find((field) => field.required && !String(form[field.name] ?? '').trim())
    if (required) return setClientError(`${required.label} es obligatorio`)
    if (config.singular === 'material') {
      const numeric = ['stockMinimo', 'stockMaximo', 'demandaDiariaPromedio', 'demandaDiariaMaxima', 'tiempoEntregaDias']
      if (numeric.some((name) => Number(form[name]) < 0 || form[name] === '')) return setClientError('Los valores numéricos deben ser mayores o iguales a cero')
      if (Number(form.stockMaximo) < Number(form.stockMinimo)) return setClientError('El stock máximo debe ser mayor o igual al mínimo')
      if (Number(form.demandaDiariaMaxima) < Number(form.demandaDiariaPromedio)) return setClientError('La demanda máxima debe ser mayor o igual a la promedio')
    }
    setClientError(''); onSubmit(form)
  }
  return <form onSubmit={submit}><div className="form-grid">{config.fields.map((field) => <label className={field.type === 'textarea' ? 'form-field full' : 'form-field'} key={field.name}><span>{field.label}{field.required && ' *'}</span>{field.type === 'textarea' ? <textarea value={form[field.name] ?? ''} onChange={(event) => change(field.name, event.target.value)} disabled={readOnly} rows={3} /> : field.type === 'select' ? <select value={form[field.name] ?? ''} onChange={(event) => change(field.name, event.target.value)} disabled={readOnly}><option value="">Seleccionar</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input type={field.type || 'text'} min={field.min} step={field.type === 'number' ? '0.001' : undefined} value={form[field.name] ?? ''} onChange={(event) => change(field.name, event.target.value)} disabled={readOnly} />}</label>)}</div>{(clientError || error) && <div className="form-error">{clientError || error}</div>}<div className="modal-actions">{readOnly ? <button className="button primary" type="button" onClick={onClose}>Cerrar</button> : <><button className="button secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="button primary" disabled={saving}>{saving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear registro'}</button></>}</div></form>
}

export default function CatalogPage({ type }) {
  const config = configs[type]; const [rows, setRows] = useState(null); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [modal, setModal] = useState(null); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState(''); const [deleteTarget, setDeleteTarget] = useState(null)
  const load = () => { setError(''); return apiClient.get(config.endpoint).then(setRows).catch((err) => setError(err.message)) }
  useEffect(() => {
    let active = true
    apiClient.get(config.endpoint).then((data) => { if (active) setRows(data) }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [config.endpoint])
  const filteredRows = useMemo(() => (rows || []).filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query.toLowerCase()))), [rows, query])
  const save = (form) => { setSaving(true); const request = modal.mode === 'edit' ? apiClient.put(`${config.endpoint}/${modal.row.id}`, form) : apiClient.post(config.endpoint, form); request.then(() => { setModal(null); setNotice(`${config.singular[0].toUpperCase() + config.singular.slice(1)} guardado correctamente`); load() }).catch((err) => setError(err.message)).finally(() => setSaving(false)) }
  const remove = () => { setSaving(true); apiClient.delete(`${config.endpoint}/${deleteTarget.id}`).then(() => { setDeleteTarget(null); setNotice('Registro eliminado correctamente'); load() }).catch((err) => setError(err.message)).finally(() => setSaving(false)) }
  return <><PageHeader title={config.title} description={config.description} action={<button className="button primary" onClick={() => setModal({ mode: 'create', row: emptyForm(config.fields) })}><Plus size={17} /> Nuevo {config.singular}</button>} />
    {notice && <div className="success-message" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar mensaje">×</button></div>}
    <div className="panel"><div className="panel-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${config.singular}...`} /></div><span>{rows ? `${filteredRows.length} de ${rows.length} registros` : 'Consultando API...'}</span></div>{error && !rows ? <ErrorState message={error} /> : rows ? <DataTable rows={filteredRows} columns={[...config.columns, { key: 'actions', label: 'Acciones', render: (row) => <div className="row-actions"><button className="table-action" onClick={() => setModal({ mode: 'view', row })} title="Ver detalles"><Eye size={16} /></button><button className="table-action" onClick={() => setModal({ mode: 'edit', row })} title="Editar"><Pencil size={16} /></button><button className="table-action danger" onClick={() => setDeleteTarget(row)} title="Eliminar"><Trash2 size={16} /></button></div> }]} empty="No hay registros que coincidan con la búsqueda" /> : <LoadingState />}</div>
    {modal && <Modal wide title={`${modal.mode === 'create' ? 'Nuevo' : modal.mode === 'edit' ? 'Editar' : 'Detalle'} ${config.singular}`} onClose={() => !saving && setModal(null)}><CatalogForm config={config} value={modal.row} mode={modal.mode} onSubmit={save} onClose={() => setModal(null)} saving={saving} error={error && rows ? error : ''} /></Modal>}
    {deleteTarget && <ConfirmDialog title={`Eliminar ${config.singular}`} message={`¿Seguro que deseas eliminar “${deleteTarget.nombre || deleteTarget.codigo || deleteTarget.identificacion}”? Esta acción puede ser rechazada si tiene historial relacionado.`} onCancel={() => !saving && setDeleteTarget(null)} onConfirm={remove} loading={saving} />}
  </>
}
