'use client'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import { LayoutDashboard, TrendingUp, TrendingDown, AlertTriangle, Users, DollarSign, Activity, Shield } from 'lucide-react'

function KPI({ label, value, sub, color = 'blue', trend, icon: Icon }) {
  const colors = { blue: '#3b82f6', red: '#ef4444', amber: '#f59e0b', green: '#10b981', violet: '#8b5cf6' }
  const c = colors[color] || colors.blue
  return (
    <div className={`kpi-card ${color}`} style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
        {Icon && <div style={{ width: 30, height: 30, borderRadius: 8, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={c} />
        </div>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{sub}</div>}
      {trend != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: trend >= 0 ? '#ef4444' : '#10b981' }}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['exec-summary'],
    queryFn: () => api.get('/api/reports/executive-summary').then(r => r.data),
  })
  const { data: alertsSummary } = useQuery({
    queryKey: ['alerts-summary'],
    queryFn: () => api.get('/api/alerts/summary').then(r => r.data),
  })
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/api/branches/').then(r => r.data),
  })

  const s = summary || {}
  const portfolio = s.portfolio || {}
  const riskBreakdown = s.risk_breakdown || {}
  const topAlerts = s.top_alerts || []

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <LayoutDashboard size={22} color="var(--blue)" /> Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>AB Rwanda Risk Analytics — Portfolio Overview</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              <KPI label="Total Portfolio" value={formatRWF(portfolio.total_outstanding)} sub={`${portfolio.total_loans || 0} active loans`} color="blue" icon={DollarSign} />
              <KPI label="PAR > 30" value={formatPct(portfolio.par30_rate)} sub={formatRWF(portfolio.par30_amount)} color="amber" icon={Activity} />
              <KPI label="NPL Ratio" value={formatPct(portfolio.npl_ratio)} sub="Non-performing loans" color="red" icon={TrendingDown} />
              <KPI label="Active Clients" value={(riskBreakdown.total || 0).toLocaleString()} sub={`${branches?.length || 0} branches`} color="green" icon={Users} />
              <KPI label="Critical Alerts" value={alertsSummary?.critical || 0} sub={`${alertsSummary?.unresolved || 0} unresolved total`} color="red" icon={AlertTriangle} />
              <KPI label="Write-offs" value={formatRWF(portfolio.total_writeoffs)} sub="Cumulative" color="violet" icon={Shield} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Risk Breakdown */}
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Client Risk Distribution</h2>
                {[
                  { label: 'Critical', key: 'critical', color: '#ef4444' },
                  { label: 'High', key: 'high', color: '#f59e0b' },
                  { label: 'Medium', key: 'medium', color: '#3b82f6' },
                  { label: 'Low', key: 'low', color: '#10b981' },
                ].map(({ label, key, color }) => {
                  const count = riskBreakdown[key] || 0
                  const total = riskBreakdown.total || 1
                  const pct = (count / total * 100).toFixed(1)
                  return (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color }}>{count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Top Alerts */}
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color="var(--red)" /> Recent Risk Alerts
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topAlerts.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No active alerts</p>}
                  {topAlerts.slice(0, 5).map((alert, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f59e0b' : '#3b82f6'}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{alert.alert_type?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{alert.branches?.name || 'Portfolio-wide'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Branch Summary */}
            {branches && branches.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Branch Network</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {branches.map(b => (
                    <div key={b.id} style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{b.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{b.province}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
