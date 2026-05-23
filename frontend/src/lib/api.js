import axios from 'axios'
import Cookies from 'js-cookie'

// Use relative URL so requests go through Next.js (which proxies to backend)
// Auth routes are handled by Next.js API routes directly — no backend needed
const BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const formatRWF = (value) => {
  if (!value && value !== 0) return '—'
  const n = Number(value)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B RWF`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M RWF`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K RWF`
  return `${n.toFixed(0)} RWF`
}

export const formatPct = (v, decimals = 1) => v != null ? `${Number(v).toFixed(decimals)}%` : '—'

export const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
}
