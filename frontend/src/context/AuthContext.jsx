import { useEffect, useState } from 'react'
import { apiClient } from '../services/api'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true)
  useEffect(() => { apiClient.get('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const signIn = async (credentials) => { const result = await apiClient.post('/auth/login', credentials); setUser(result.user); return result.user }
  const signOut = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }
  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}
