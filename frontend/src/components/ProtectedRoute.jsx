import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LoadingState } from './UI'

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState label="Verificando sesión..." />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return !roles || roles.includes(user.rol) ? <Outlet /> : <Navigate to="/" replace />
}
