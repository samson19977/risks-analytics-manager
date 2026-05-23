'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Activity, ChevronRight, Shield, BarChart2, Eye, Users, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_USERS = [
  { email: 'admin@abrwanda.rw',     full_name: 'Admin User',        role: 'admin',          icon: Shield,   color: '#7c3aed', desc: 'Full platform access' },
  { email: 'risk@abrwanda.com',     full_name: 'Risk Manager',      role: 'risk_manager',   icon: BarChart2,color: '#2563eb', desc: 'Risk monitoring & alerts' },
  { email: 'analyst@abrwanda.com',  full_name: 'Portfolio Analyst', role: 'analyst',        icon: BarChart2,color: '#0891b2', desc: 'Portfolio & analytics' },
  { email: 'branch@abrwanda.com',   full_name: 'Branch Manager',    role: 'branch_manager', icon: GitBranch,color: '#059669', desc: 'Branch operations' },
  { email: 'viewer@abrwanda.com',   full_name: 'Executive Viewer',  role: 'viewer',         icon: Eye,      color: '#d97706', desc: 'Read-only executive view' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await login(selected.email)
      toast.success(`Welcome, ${selected.full_name}!`)
      router.push('/dashboard')
    } catch (err) {
      toast.error('Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 800px 600px at 50% 30%, rgba(37,99,235,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 0 40px rgba(59,130,246,0.35)',
          }}>
            <Activity size={24} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            AB Rwanda
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Risk Analytics Platform
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Choose your account
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>
            Select a role to explore the platform — no password required.
          </p>

          {/* User cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {DEMO_USERS.map(u => {
              const Icon = u.icon
              const isSelected = selected?.email === u.email
              return (
                <div
                  key={u.email}
                  onClick={() => setSelected(u)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${isSelected ? u.color : 'var(--border)'}`,
                    background: isSelected ? `${u.color}14` : 'var(--bg-3)',
                    transition: 'all 0.15s',
                    outline: 'none',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${u.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={u.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                      {u.full_name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.desc}</p>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? u.color : 'var(--border)'}`,
                    background: isSelected ? u.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleSignIn}
            disabled={!selected || loading}
            style={{
              width: '100%', padding: '12px 20px',
              background: selected
                ? `linear-gradient(135deg, ${selected.color}, #7c3aed)`
                : 'var(--bg-3)',
              border: 'none', borderRadius: 8, color: selected ? 'white' : 'var(--text-3)',
              fontSize: 13, fontWeight: 700,
              cursor: (!selected || loading) ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {loading ? 'Signing in…' : (
              <>
                {selected ? `Sign in as ${selected.full_name}` : 'Select an account above'}
                {selected && !loading && <ChevronRight size={15} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
