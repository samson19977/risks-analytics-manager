'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

// Demo credentials
export const DEMO_USER = {
  id: 'demo-001',
  email: 'admin@abrwanda.rw',
  full_name: 'Demo Admin',
  role: 'risk_manager',
}
const DEMO_PASSWORD = 'demo1234'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token')
    if (token === 'demo-token') {
      setUser(DEMO_USER)
      setLoading(false)
      return
    }
    if (token) {
      api.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => {
          Cookies.remove('token')
          localStorage.removeItem('token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    // Demo login — works offline
    if (email === DEMO_USER.email && password === DEMO_PASSWORD) {
      Cookies.set('token', 'demo-token', { expires: 1 })
      localStorage.setItem('token', 'demo-token')
      setUser(DEMO_USER)
      return DEMO_USER
    }
    // Real backend login
    const r = await api.post('/api/auth/login', { email, password })
    const { access_token, user: u } = r.data
    Cookies.set('token', access_token, { expires: 1 })
    localStorage.setItem('token', access_token)
    setUser(u)
    return u
  }

  const logout = () => {
    Cookies.remove('token')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
