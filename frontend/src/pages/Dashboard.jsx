import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpFromLine, Boxes, ClipboardList, Package, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '../services/api'
import { DataTable, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/UI'

const colors = ['#f59e0b', '#334155', '#64748b', '#fbbf24', '#94a3b8']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.allSettled([
      apiClient.get('/materiales'), apiClient.get('/ubicaciones'), apiClient.get('/proveedores'), apiClient.get('/ordenes-compra'), apiClient.get('/alertas?estado=ACTIVA'), apiClient.get('/inventario/stock'), apiClient.get('/movimientos'),
    ]).then((results) => {
      const values = results.map((result) => result.status === 'fulfilled' ? result.value : [])
      if (results.every((result) => result.status === 'rejected')) setError('No fue posible conectar con el backend')
      setData({ materials: values[0], locations: values[1], suppliers: values[2], orders: values[3], alerts: values[4], stock: values[5], movements: values[6] })
    })
  }, [])
  const stockByLocation = useMemo(() => Object.values((data?.stock || []).filter((row) => row.ubicacionId).reduce((acc, row) => { acc[row.ubicacion] = (acc[row.ubicacion] || 0) + Number(row.stock || 0); return acc }, {})).map((value, index) => ({ name: Object.keys((data?.stock || []).filter((row) => row.ubicacionId).reduce((acc, row) => { acc[row.ubicacion] = true; return acc }, {}))[index], value })), [data])
  const movementTypes = useMemo(() => Object.entries((data?.movements || []).reduce((acc, row) => { acc[row.tipo] = (acc[row.tipo] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value })), [data])
  const orderStates = useMemo(() => Object.entries((data?.orders || []).reduce((acc, row) => { acc[row.estado] = (acc[row.estado] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name: name.replaceAll('_', ' '), value })), [data])
  if (!data && !error) return <LoadingState />
  if (error && !data) return <ErrorState message={error} />
  const stats = [{ label: 'Materiales', value: data.materials.length, icon: Package, tone: 'amber' }, { label: 'Ubicaciones', value: data.locations.length, icon: Boxes, tone: 'slate' }, { label: 'Proveedores', value: data.suppliers.length, icon: TrendingUp, tone: 'blue' }, { label: 'Órdenes de compra', value: data.orders.length, icon: ClipboardList, tone: 'violet' }]
  return <><PageHeader title="Resumen operativo" description="Una vista clara del inventario y las operaciones de tu empresa." action={<span className="date-chip">Datos en tiempo real</span>} />
    <section className="stat-grid">{stats.map(({ label, value, icon: Icon, tone }) => <div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong></div><small>Registros actuales</small></div>)}</section>
    <section className="dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h2>Existencias por ubicación</h2><p>Unidades registradas en cada punto</p></div><Boxes size={19} /></div>{stockByLocation.length ? <ResponsiveContainer width="100%" height={250}><BarChart data={stockByLocation}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#f59e0b" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyState label="Aún no hay existencias registradas" />}</div><div className="panel chart-panel"><div className="panel-heading"><div><h2>Movimientos por tipo</h2><p>Actividad del inventario</p></div><ArrowUpFromLine size={19} /></div>{movementTypes.length ? <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={movementTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>{movementTypes.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <EmptyState label="Aún no hay movimientos registrados" />}</div></section>
    <section className="dashboard-grid lower"><div className="panel"><div className="panel-heading"><div><h2>Órdenes por estado</h2><p>Seguimiento de compras</p></div><ClipboardList size={19} /></div>{orderStates.length ? <div className="state-list">{orderStates.map((row) => <div className="state-row" key={row.name}><span>{row.name}</span><strong>{row.value}</strong></div>)}</div> : <EmptyState label="Aún no hay órdenes de compra" />}</div><div className="panel"><div className="panel-heading"><div><h2>Alertas activas</h2><p>Requieren atención operativa</p></div><AlertTriangle size={19} /></div>{data.alerts.length ? <DataTable rows={data.alerts.slice(0, 5)} columns={[{ key: 'tipo', label: 'Tipo', render: (row) => <StatusBadge value={row.tipo} /> }, { key: 'descripcion', label: 'Descripción' }]} /> : <EmptyState label="No hay alertas activas" />}</div></section>
  </>
}
