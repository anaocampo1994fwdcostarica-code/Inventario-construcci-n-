import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LoadingState } from './UI'

export default function ProtectedRoute() { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <LoadingState label="Verificando sesión..." />; return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
