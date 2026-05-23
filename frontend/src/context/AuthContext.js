'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

// Demo users that work offline when the backend is unavailable
const DEMO_USERS = {
  'admin@abrwanda.rw': {
    password: 'demo1234',
    user: { id: 'demo-1', email: 'admin@abrwanda.rw', full_name: 'Admin User', role: 'admin' },
  },
  'admin@abrwanda.com': {
    password: 'admin123',
    user: { id: 'demo-1', email: 'admin@abrwanda.com', full_name: 'Admin User', role: 'admin' },
  },
  'risk@abrwanda.com': {
    password: 'risk123',
    user: { id: 'demo-2', email: 'risk@abrwanda.com', full_name: 'Risk Manager', role: 'risk_manager' },
  },
  'analyst@abrwanda.com': {
    password: 'analyst123',
    user: { id: 'demo-3', email: 'analyst@abrwanda.com', full_name: 'Portfolio Analyst', role: 'analyst' },
  },
}

const DEMO_TOKEN = 'demo-mode-token'

function isDemoToken(token) {
  return token === DEMO_TOKEN
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token')
    if (token) {
      if (isDemoToken(token)) {
        // Restore demo user from storage
        try {
          const saved = localStorage.getItem('demo_user')
          if (saved) setUser(JSON.parse(saved))
        } catch {}
        setLoading(false)
      } else {
        api.get('/api/auth/me')
          .then(r => setUser(r.data))
          .catch(() => {
            Cookies.remove('token')
            localStorage.removeItem('token')
          })
          .finally(() => setLoading(false))
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    // Try real API first
    try {
      const r = await api.post('/api/auth/login', { email, password })
      const { access_token, user: u } = r.data
      Cookies.set('token', access_token, { expires: 1 })
      localStorage.setItem('token', access_token)
      setUser(u)
      return u
    } catch (err) {
      // If network error (no backend), try demo credentials
      const isNetworkError = !err?.response
      if (isNetworkError) {
        const demo = DEMO_USERS[email.trim().toLowerCase()]
        if (demo && demo.password === password) {
          Cookies.set('token', DEMO_TOKEN, { expires: 1 })
          localStorage.setItem('token', DEMO_TOKEN)
          localStorage.setItem('demo_user', JSON.stringify(demo.user))
          setUser(demo.user)
          return demo.user
        }
        throw new Error('Invalid email or password.')
      }
      // Real API error (401, etc) — rethrow
      throw err
    }
  }

  const logout = () => {
    Cookies.remove('token')
    localStorage.removeItem('token')
    localStorage.removeItem('demo_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
