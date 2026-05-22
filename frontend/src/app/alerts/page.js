'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { AlertTriangle, CheckCircle, Clock, Bell } from 'lucide-react'

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const qc = useQueryClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, showResolved],
    queryFn: () => api.get('/api/alerts/', {
      params: { severity: severityFilter || undefined, is_resolved: showResolved, limit: 100 }
    }).then(r => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['alerts-summary'],
    queryFn: () => api.get('/api/alerts/summary').then(r => r.data),
  })

  const resolve = useMutation({
    mutationFn: ({ id, notes }) => api.post(`/api/alerts/${id}/resolve`, { resolved_by: 'User', notes }),
    onSuccess: () => { qc.invalidateQueries(['alerts']); qc.invalidateQueries(['alerts-summary']) },
  })

  const severities = ['', 'critical', 'high', 'medium', 'low']
  const COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' }

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={22} color="var(--red)" /> Risk Alerts
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Monitor and resolve portfolio risk alerts</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Critical', count: summary.critical, color: '#ef4444', icon: AlertTriangle },
              { label: 'High', count: summary.high, color: '#f59e0b', icon: Bell },
              { label: 'Medium', count: summary.medium, color: '#3b82f6', icon: Clock },
              { label: 'Total Unresolved', count: summary.unresolved, color: 'var(--text-3)', icon: AlertTriangle },
            ].map(({ label, count, color, icon: Icon }) => (
              <div key={label} className="card" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Syne, sans-serif', color }}>{count ?? 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {severities.map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer',
                  background: severityFilter === s ? (COLORS[s] || 'var(--blue)') : 'var(--surface)',
                  borderColor: severityFilter === s ? (COLORS[s] || 'var(--blue)') : 'var(--border)',
                  color: severityFilter === s ? '#fff' : 'var(--text-3)',
                }}>
                {s || 'All'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowResolved(!showResolved)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', marginLeft: 'auto',
              background: showResolved ? 'var(--green)' : 'var(--surface)',
              borderColor: showResolved ? 'var(--green)' : 'var(--border)',
              color: showResolved ? '#fff' : 'var(--text-3)',
            }}>
            {showResolved ? '✓ Showing Resolved' : 'Show Resolved'}
          </button>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(alerts || []).map(alert => {
              const color = COLORS[alert.severity] || 'var(--text-3)'
              return (
                <div key={alert.id} className="card" style={{ padding: 16, borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
                          {alert.alert_type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {alert.message && <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.5 }}>{alert.message}</p>}
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
                        {alert.branches?.name && <span>📍 {alert.branches.name}</span>}
                        <span>🕐 {alert.created_at?.slice(0, 10)}</span>
                        {alert.is_resolved && <span style={{ color: '#10b981' }}>✓ Resolved</span>}
                      </div>
                    </div>
                    {!alert.is_resolved && (
                      <button
                        onClick={() => resolve.mutate({ id: alert.id, notes: 'Reviewed and resolved' })}
                        disabled={resolve.isLoading}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <CheckCircle size={12} /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {(!alerts || alerts.length === 0) && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)', fontSize: 13 }}>
                <CheckCircle size={32} color="var(--green)" style={{ margin: '0 auto 12px', display: 'block' }} />
                No alerts found
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
