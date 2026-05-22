'use client'
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const DEFAULT_USER = {
  id: 'demo-001',
  email: 'admin@abrwanda.rw',
  full_name: 'Demo Admin',
  role: 'risk_manager',
}

export function AuthProvider({ children }) {
  const [user] = useState(DEFAULT_USER)
  const logout = () => { window.location.href = '/dashboard' }
  return (
    <AuthContext.Provider value={{ user, loading: false, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)