'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  GitBranch,
  Users,
  BarChart3,
  AlertTriangle,
  Zap,
  Shield,
  Brain,
  FileText,
  LogOut,
  Menu,
  ChevronRight,
  Activity,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/branches', icon: GitBranch, label: 'Branch Analytics' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/analytics', icon: BarChart3, label: 'Portfolio Analytics' },
  { href: '/alerts', icon: AlertTriangle, label: 'Risk Alerts' },
  { href: '/stress-test', icon: Zap, label: 'Stress Testing' },
  { href: '/fraud', icon: Shield, label: 'Fraud Detection' },
  { href: '/ai-insights', icon: Brain, label: 'AI Insights' },
  { href: '/reports', icon: FileText, label: 'Reports' },
]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside
        style={{
          width: collapsed ? 60 : 220,
          background: 'var(--bg-2)',
          borderRight: '1px solid var(--border-2)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 16px 16px',
            borderBottom: '1px solid var(--border-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 64,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.3)',
            }}
          >
            <Activity size={16} color="white" />
          </div>

          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 13,
                  color: 'var(--text)',
                  lineHeight: 1.2,
                }}
              >
                AB Rwanda
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--text-3)',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Risk Platform
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{
                  marginBottom: 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? label : undefined}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div
          style={{
            padding: '12px 8px',
            borderTop: '1px solid var(--border-2)',
          }}
        >
          {!collapsed && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: 6,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.full_name}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-3)',
                  textTransform: 'capitalize',
                }}
              >
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="nav-item"
            style={{
              width: '100%',
              border: 'none',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <LogOut size={15} />
            {!collapsed && <span>Sign out</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="nav-item"
            style={{
              width: '100%',
              border: 'none',
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginTop: 2,
            }}
          >
            {collapsed ? <ChevronRight size={15} /> : <Menu size={15} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: collapsed ? 60 : 220,
          transition: 'margin-left 0.25s ease',
          minHeight: '100vh',
          padding: '24px 28px',
          maxWidth: '100%',
        }}
      >
        {children}
      </main>
    </div>
  )
}