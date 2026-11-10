import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Boxes, Building2, ClipboardList, Factory, FileBarChart, Gauge, LogOut, Menu, Package, Plus, Users, X } from 'lucide-react'
import { useAuth } from '../context/useAuth'

const navigation = [
  { label: 'Dashboard', path: '/', icon: Gauge }, { label: 'Materiales', path: '/materiales', icon: Package }, { label: 'Ubicaciones', path: '/ubicaciones', icon: Building2 }, { label: 'Proveedores', path: '/proveedores', icon: Factory }, { label: 'Usuarios', path: '/usuarios', icon: Users }, { label: 'Movimientos', path: '/movimientos', icon: Boxes }, { label: 'Órdenes de compra', path: '/ordenes-compra', icon: ClipboardList }, { label: 'Reportes', path: '/reportes', icon: FileBarChart },
]

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth(); const navigate = useNavigate(); const location = useLocation()
  const current = navigation.find((item) => item.path === location.pathname) || navigation.find((item) => item.path !== '/' && location.pathname.startsWith(item.path)) || navigation[0]
  const visibleNavigation = navigation.filter((item) => item.path !== '/usuarios' || user?.rol === 'ADMINISTRADOR')
  const handleSignOut = async () => { try { await signOut() } finally { navigate('/login', { replace: true }) } }
  return <div className={`app-shell role-${user?.rol || 'ANONIMO'} page-${location.pathname.slice(1).replaceAll('/', '-') || 'dashboard'}`}>
    {open && <button className="mobile-overlay" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Boxes size={18} /></div><div><strong>ObraStock</strong><span>Control de inventario</span></div><button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X size={19} /></button></div>
      <nav className="nav-list">{visibleNavigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer"><div className="user-avatar">{user?.nombre?.[0] || 'U'}</div><div><strong>{user?.nombre}</strong><span>{user?.rol}</span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><button className="icon-button menu-toggle" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu size={22} /></button><div><span className="breadcrumb">Operación /</span><strong>{current.label}</strong></div><div className="topbar-actions"><Link className="button quick-action secondary" to="/ordenes-compra"><Plus size={15} /> Nueva orden</Link><Link className="button quick-action primary" to="/movimientos"><Boxes size={15} /> Registrar movimiento</Link><span className="topbar-status"><span className="online-dot" /> API conectada</span><Link className="icon-button alert-header-button" to="/alertas" title="Alertas" aria-label="Ir a alertas"><Bell size={18} /></Link><button type="button" className="icon-button signout-button" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={handleSignOut}><LogOut size={18} /></button></div></header><main className="content"><Outlet /></main></div>
  </div>
}
