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
  const { data: raw, isLoading } = useQuery({
    queryKey: ['exec-summary'],
    queryFn: () => api.get('/api/reports/executive-summary').then(r => r.data).catch(() => null),
    retry: false,
  })
  // Also fetch portfolio summary as fallback
  const { data: portfolioSummary } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => api.get('/api/portfolio/summary').then(r => r.data).catch(() => null),
    retry: false,
  })
  const { data: alertsSummary } = useQuery({
    queryKey: ['alerts-summary'],
    queryFn: () => api.get('/api/alerts/summary').then(r => r.data).catch(() => null),
    retry: false,
  })
  const { data: branchesRaw } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/api/branches/').then(r => r.data).catch(() => null),
    retry: false,
  })

  const isLive = !!raw || !!portfolioSummary

  // Prefer exec summary shape, fall back to portfolio summary shape
  const portfolio = raw?.portfolio_overview || (portfolioSummary ? {
    gross_loan_portfolio: portfolioSummary.gross_loan_portfolio,
    active_loans: portfolioSummary.active_loans,
    active_clients: portfolioSummary.total_clients,
    branches: branchesRaw?.length || 0,
  } : {})
  const risk = raw?.risk_metrics || (portfolioSummary ? {
    par30_pct: portfolioSummary.par_30_pct,
    par30_amount: portfolioSummary.par_30_amount,
    npl_pct: portfolioSummary.npl_ratio,
    write_offs: portfolioSummary.write_offs_total,
  } : {})
  const riskBreakdown = raw?.risk_distribution || portfolioSummary?.risk_distribution || {}
  const topAlerts = raw?.top_alerts || []
  // Backend alerts/summary returns: { critical, high, medium, unresolved, total }
  const alertData = alertsSummary || raw?.alerts || {}
  const branches = branchesRaw || []

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayoutDashboard size={22} color="var(--blue)" /> Dashboard
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>AB Rwanda Risk Analytics — Portfolio Overview</p>
          </div>
          {!isLive && !isLoading && (
            <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
              ⚡ Backend unreachable — start the backend server
            </div>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              <KPI label="Total Portfolio" value={formatRWF(portfolio.gross_loan_portfolio)} sub={`${portfolio.active_loans || 0} active loans`} color="blue" icon={DollarSign} />
              <KPI label="PAR > 30" value={formatPct(risk.par30_pct)} sub={formatRWF(risk.par30_amount)} color="amber" icon={Activity} />
              <KPI label="NPL Ratio" value={formatPct(risk.npl_pct)} sub="Non-performing loans" color="red" icon={TrendingDown} />
              <KPI label="Active Clients" value={(portfolio.active_clients || 0).toLocaleString()} sub={`${portfolio.branches || branches?.length || 0} branches`} color="green" icon={Users} />
              {/* alertData.unresolved is the correct backend field */}
              <KPI label="Critical Alerts" value={alertData?.critical ?? 0} sub={`${alertData?.unresolved ?? 0} unresolved total`} color="red" icon={AlertTriangle} />
              <KPI label="Write-offs" value={formatRWF(risk.write_offs)} sub="Cumulative" color="violet" icon={Shield} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Risk Distribution */}
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Client Risk Distribution</h2>
                {[
                  { label: 'Critical', key: 'critical', color: '#ef4444' },
                  { label: 'High', key: 'high', color: '#f59e0b' },
                  { label: 'Medium', key: 'medium', color: '#3b82f6' },
                  { label: 'Low', key: 'low', color: '#10b981' },
                ].map(({ label, key, color }) => {
                  const count = riskBreakdown[key] || 0
                  const total = Object.values(riskBreakdown).reduce((a, b) => a + (Number(b) || 0), 0) || 1
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

              {/* Recent Alerts */}
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color="var(--red)" /> Recent Risk Alerts
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topAlerts.length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                      {isLive ? 'No active alerts' : 'Connect backend to see alerts'}
                    </p>
                  )}
                  {topAlerts.slice(0, 5).map((alert, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f59e0b' : '#3b82f6'}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2, textTransform: 'capitalize' }}>{alert.alert_type?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{alert.branches?.name || 'Portfolio-wide'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Branch Network */}
            {branches.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Branch Network</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {branches.map(b => (
                    <div key={b.id} style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{b.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{b.province}</div>
                      {b.par30_rate != null && (
                        <div style={{ fontSize: 11, marginTop: 4, color: b.par30_rate > 10 ? '#ef4444' : b.par30_rate > 5 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                          PAR {formatPct(b.par30_rate)}
                        </div>
                      )}
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
