import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import CatalogPage from './pages/CatalogPage'
import Dashboard from './pages/Dashboard'
import OperationsPage from './pages/OperationsPage'
import ReportsPage from './pages/ReportsPage'
import MovementPage from './pages/MovementPage'
import UsersPage from './pages/UsersPage'
import AlertsPage from './pages/AlertsPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext.jsx'
import './App.css'

export default function App() {
  return <AuthProvider><BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route index element={<Dashboard />} /><Route path="materiales" element={<CatalogPage type="materiales" />} /><Route path="ubicaciones" element={<CatalogPage type="ubicaciones" />} /><Route path="proveedores" element={<CatalogPage type="proveedores" />} /><Route path="usuarios" element={<UsersPage />} /><Route path="movimientos" element={<MovementPage />} /><Route path="ordenes-compra" element={<OperationsPage type="ordenes" />} /><Route path="alertas" element={<AlertsPage />} /><Route path="reportes" element={<ReportsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Route></Routes></BrowserRouter></AuthProvider>
}
