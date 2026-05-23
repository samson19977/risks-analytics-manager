'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token')
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

  // Only email required — no password
  const login = async (email) => {
    const r = await api.post('/api/auth/login', { email })
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
