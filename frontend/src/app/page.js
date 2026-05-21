'use client'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct, RISK_COLORS } from '@/lib/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, AlertTriangle, Shield, Users, CreditCard,
  Brain, ArrowUpRight, ArrowDownRight, ChevronRight, Zap, Target, Activity,
} from 'lucide-react'
import Link from 'next/link'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#131e33', border: '1px solid rgba(99,148,255,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong style={{ color: 'var(--text)' }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function KpiCard({ title, value, subtitle, color, trend, trendValue, icon: Icon, href }) {
  const colors = { blue: '#3b82f6', red: '#ef4444', green: '#10b981', amber: '#f59e0b', violet: '#8b5cf6', cyan: '#06b6d4' }
  const c = colors[color] || '#3b82f6'
  const isUp = trend === 'up'
  const inner = (
    <div className={`kpi-card ${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${c}18`, border: `1px solid ${c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={c} />
        </div>
        {trendValue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: (isUp && color === 'red') || (isUp && color === 'amber') ? '#ef4444' : isUp ? '#10b981' : '#ef4444' }}>
            {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trendValue}
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{subtitle}</div>}
    </div>
  )
  return href ? <Link href={href} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>{inner}</Link>
              : <div style={{ flex: 1, minWidth: 0 }}>{inner}</div>
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['summary'], queryFn: () => api.get('/api/portfolio/summary').then(r => r.data) })
  const { data: trends } = useQuery({ queryKey: ['trends'], queryFn: () => api.get('/api/portfolio/trends?months=9').then(r => r.data) })
  const { data: alertsSummary } = useQuery({ queryKey: ['alerts-summary'], queryFn: () => api.get('/api/alerts/summary').then(r => r.data) })
  const { data: alerts } = useQuery({ queryKey: ['alerts-list'], queryFn: () => api.get('/api/alerts/?limit=5').then(r => r.data) })
  const { data: branches } = useQuery({ queryKey: ['branch-perf'], queryFn: () => api.get('/api/branches/performance').then(r => r.data) })
  const { data: sectorData } = useQuery({ queryKey: ['sector'], queryFn: () => api.get('/api/portfolio/sector-concentration').then(r => r.data) })
  const { data: parAging } = useQuery({ queryKey: ['par-aging'], queryFn: () => api.get('/api/portfolio/par-aging').then(r => r.data) })
  const { data: insights } = useQuery({ queryKey: ['quick-insights'], queryFn: () => api.get('/api/ai/quick-insights').then(r => r.data) })

  const s = summary || {}
  const trendData = (trends || []).map(t => ({
    month: t.month?.slice(5),
    'PAR>30': t.par_30,
    NPL: t.npl_ratio,
    Restructured: t.restructured_pct,
    Portfolio: t.gross_loan_portfolio / 1_000_000_000,
    'Repeat %': t.repeat_borrower_rate,
  }))

  const riskDist = Object.entries(s.risk_distribution || {}).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: RISK_COLORS[k],
  }))

  const agingData = (parAging || []).map((a, i) => ({
    name: ['Current', 'PAR 1-30', 'PAR 31-90', 'PAR 91-180', 'PAR 180+'][i],
    loans: a.loan_count,
    color: ['#10b981', '#f59e0b', '#ef4444', '#dc2626', '#991b1b'][i],
  }))

  if (isLoading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading portfolio data…</p>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              Portfolio Risk Dashboard
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
              Real-time portfolio health monitoring & risk intelligence
            </p>
          </div>
          {(alertsSummary?.critical || 0) > 0 && (
            <Link href="/alerts" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}>
              <AlertTriangle size={13} />
              {alertsSummary.critical} Critical Alerts
              <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <KpiCard title="Gross Loan Portfolio" value={formatRWF(s.gross_loan_portfolio)} subtitle={`${s.active_loans?.toLocaleString()} active loans`} color="blue" icon={CreditCard} trend="up" trendValue="+11%" />
          <KpiCard title="PAR > 30 Days" value={formatPct(s.par_30_pct)} subtitle={formatRWF(s.par_30_amount)} color={s.par_30_pct > 10 ? 'red' : s.par_30_pct > 7 ? 'amber' : 'green'} icon={TrendingUp} trend="up" trendValue="+2.1pp" href="/analytics" />
          <KpiCard title="NPL Ratio" value={formatPct(s.npl_ratio)} subtitle="Non-performing loans" color={s.npl_ratio > 7 ? 'red' : 'amber'} icon={AlertTriangle} trend="up" trendValue="+0.9pp" />
          <KpiCard title="Clients" value={(s.total_clients || 0).toLocaleString()} subtitle="Active borrowers" color="cyan" icon={Users} />
          <KpiCard title="Restructured" value={formatPct(s.restructured_pct)} subtitle={`${s.restructured_loans} loans`} color={s.restructured_pct > 10 ? 'red' : 'amber'} icon={Target} trend="up" trendValue="+2.3pp" />
          <KpiCard title="Unresolved Alerts" value={alertsSummary?.unresolved || 0} subtitle={`${alertsSummary?.critical || 0} critical`} color={alertsSummary?.critical > 0 ? 'red' : 'amber'} icon={Shield} href="/alerts" />
        </div>

        {/* PAR Trend + Risk Dist */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="card" style={{ padding: '20px 20px 10px' }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Portfolio Quality — 9 Month Trend</h2>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>PAR&gt;30, NPL ratio & restructured loans (assessment data)</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,148,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="PAR>30" stroke="#ef4444" fill="url(#g1)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="NPL" stroke="#f59e0b" fill="url(#g2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Restructured" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Client Risk Distribution</h2>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>By risk category</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={3}>
                  {riskDist.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#131e33', border: '1px solid rgba(99,148,255,0.15)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {riskDist.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                  {r.name}: <strong style={{ color: 'var(--text)' }}>{r.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: PAR Aging + Sector + Repeat Rate */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="card" style={{ padding: '18px 18px 8px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>PAR Aging Buckets</h2>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>Loan count by days past due</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={agingData} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#131e33', border: '1px solid rgba(99,148,255,0.15)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="loans" name="Loans" radius={[4, 4, 0, 0]}>
                  {agingData.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Sector Concentration</h2>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>Portfolio exposure by sector</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(sectorData || []).slice(0, 6).map(sec => (
                <div key={sec.sector}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{sec.sector}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>PAR: {sec.par_rate?.toFixed(1)}%</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sec.percentage > 30 ? '#ef4444' : 'var(--text)' }}>{sec.percentage?.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="risk-bar">
                    <div className="risk-fill" style={{
                      width: `${Math.min(100, sec.percentage)}%`,
                      background: sec.percentage > 30 ? 'linear-gradient(90deg,#ef4444,#f97316)' : sec.percentage > 20 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#3b82f6,#06b6d4)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 18px 8px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Repeat Borrower Rate</h2>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>Client loyalty signal (Q1→Q3 decline)</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,148,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[40, 70]} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Repeat %" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Branches + AI Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Branch Risk Overview</h2>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Ranked by PAR&gt;30 descending</p>
              </div>
              <Link href="/branches" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                All branches <ChevronRight size={13} />
              </Link>
            </div>
            <table className="data-table">
              <thead><tr><th>Branch</th><th>PAR&gt;30</th><th>NPL</th><th>Portfolio</th><th>Restructured</th><th>Risk</th></tr></thead>
              <tbody>
                {(branches || []).slice(0, 6).map(b => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/branches/${b.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>{b.name}</Link>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.province}</div>
                    </td>
                    <td><span style={{ color: b.par_30_pct > 10 ? '#ef4444' : b.par_30_pct > 7 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{b.par_30_pct?.toFixed(1)}%</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{b.npl_pct?.toFixed(1)}%</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{formatRWF(b.gross_portfolio)}</td>
                    <td style={{ color: 'var(--text-2)' }}>{b.restructured_pct?.toFixed(1)}%</td>
                    <td><span className={`badge badge-${b.risk_level}`}>{b.risk_level}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>AI Risk Insights</h2>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Auto-generated alerts</p>
              </div>
              <Link href="/ai-insights" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Full analysis <ChevronRight size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(insights || []).slice(0, 3).map((ins, i) => (
                <div key={i} className="alert-item" style={{ borderLeft: `3px solid ${RISK_COLORS[ins.type] || '#3b82f6'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{ins.title}</span>
                    <span className={`badge badge-${ins.type}`}>{ins.type}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
                    {ins.body?.slice(0, 90)}{ins.body?.length > 90 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
