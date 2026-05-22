'use client'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import { BarChart3, TrendingUp, Activity } from 'lucide-react'

const RISK_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' }

export default function AnalyticsPage() {
  const { data: heatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ['risk-heatmap'],
    queryFn: () => api.get('/api/analytics/risk-heatmap').then(r => r.data),
  })

  const { data: officers, isLoading: officersLoading } = useQuery({
    queryKey: ['officer-performance'],
    queryFn: () => api.get('/api/analytics/loan-officer-performance').then(r => r.data),
  })

  const { data: concentrations } = useQuery({
    queryKey: ['sector-concentration'],
    queryFn: () => api.get('/api/analytics/sector-concentration').then(r => r.data),
  })

  const isLoading = heatmapLoading && officersLoading

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={22} color="var(--blue)" /> Portfolio Analytics
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Risk heatmap, sector concentration, and officer performance</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Risk Heatmap Table */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="var(--blue)" /> Branch × Sector Risk Heatmap
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Province</th>
                      <th>Sector</th>
                      <th>Loans</th>
                      <th>Portfolio</th>
                      <th>PAR Rate</th>
                      <th>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(heatmap || []).slice(0, 30).map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, fontSize: 12 }}>{row.branch}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.province}</td>
                        <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{row.sector}</td>
                        <td style={{ fontSize: 12 }}>{row.loan_count}</td>
                        <td style={{ fontSize: 12 }}>{formatRWF(row.amount)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${Math.min(row.par_rate * 3, 100)}%`, background: RISK_COLORS[row.risk_level] || '#3b82f6', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{formatPct(row.par_rate)}</span>
                          </div>
                        </td>
                        <td><span className={`badge badge-${row.risk_level}`}>{row.risk_level}</span></td>
                      </tr>
                    ))}
                    {(!heatmap || heatmap.length === 0) && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Sector Concentration */}
              {concentrations && (
                <div className="card" style={{ padding: 20 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Sector Concentration</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(concentrations).slice(0, 8).map(([sector, data]) => {
                      const pct = typeof data === 'object' ? (data.pct || data.percentage || 0) : data
                      const amount = typeof data === 'object' ? (data.amount || 0) : 0
                      return (
                        <div key={sector}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{sector}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{formatPct(pct)}</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'var(--blue)', borderRadius: 2 }} />
                          </div>
                          {amount > 0 && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{formatRWF(amount)}</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Loan Officer Performance */}
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={14} color="var(--green)" /> Loan Officer Performance
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Officer</th>
                        <th>Loans</th>
                        <th>PAR 30</th>
                        <th>Portfolio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(officers || []).slice(0, 10).map((o, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 12, fontWeight: 500 }}>{o.officer || o.name || `Officer ${i + 1}`}</td>
                          <td style={{ fontSize: 12 }}>{o.total || o.loan_count || 0}</td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 600, color: (o.par30_rate || 0) > 10 ? '#ef4444' : (o.par30_rate || 0) > 5 ? '#f59e0b' : '#10b981' }}>
                              {formatPct(o.par30_rate)}
                            </span>
                          </td>
                          <td style={{ fontSize: 12 }}>{formatRWF(o.portfolio || o.total_portfolio)}</td>
                        </tr>
                      ))}
                      {(!officers || officers.length === 0) && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)' }}>No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
