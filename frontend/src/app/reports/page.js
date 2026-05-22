'use client'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import { FileText, TrendingUp, TrendingDown, BarChart2, Building2 } from 'lucide-react'

function StatRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <span style={{ color: highlight || 'var(--text)', fontWeight: 600 }}>{value ?? '—'}</span>
    </div>
  )
}

export default function ReportsPage() {
  const { data: execSummary, isLoading } = useQuery({
    queryKey: ['exec-summary'],
    queryFn: () => api.get('/api/reports/executive-summary').then(r => r.data),
  })

  const { data: branchReport } = useQuery({
    queryKey: ['branch-report'],
    queryFn: () => api.get('/api/reports/branch-performance').then(r => r.data),
  })

  const s = execSummary || {}
  const portfolio = s.portfolio || {}
  const trend = s.trend_summary || {}

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} color="var(--blue)" /> Reports
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Executive summaries and branch performance reports</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Executive Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChart2 size={14} color="var(--blue)" /> Portfolio Summary
                </h2>
                <StatRow label="Total Loans" value={portfolio.total_loans?.toLocaleString()} />
                <StatRow label="Total Outstanding" value={formatRWF(portfolio.total_outstanding)} />
                <StatRow label="Total Disbursed" value={formatRWF(portfolio.total_disbursed)} />
                <StatRow label="PAR > 30 Rate" value={formatPct(portfolio.par30_rate)} highlight={portfolio.par30_rate > 10 ? '#ef4444' : portfolio.par30_rate > 5 ? '#f59e0b' : '#10b981'} />
                <StatRow label="PAR > 30 Amount" value={formatRWF(portfolio.par30_amount)} />
                <StatRow label="NPL Ratio" value={formatPct(portfolio.npl_ratio)} highlight={portfolio.npl_ratio > 5 ? '#ef4444' : '#10b981'} />
                <StatRow label="NPL Amount" value={formatRWF(portfolio.npl_amount)} />
                <StatRow label="Total Write-offs" value={formatRWF(portfolio.total_writeoffs)} />
              </div>

              {/* Trend Analysis */}
              {Object.keys(trend).length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color="var(--green)" /> Trend Analysis (Q1 vs Q3)
                  </h2>
                  {[
                    { label: 'PAR 30 — Q1', value: formatPct(trend.par30_q1) },
                    { label: 'PAR 30 — Q3', value: formatPct(trend.par30_q3), highlight: (trend.par30_q3 || 0) > (trend.par30_q1 || 0) ? '#ef4444' : '#10b981' },
                    { label: 'NPL — Q1', value: formatPct(trend.npl_q1) },
                    { label: 'NPL — Q3', value: formatPct(trend.npl_q3), highlight: (trend.npl_q3 || 0) > (trend.npl_q1 || 0) ? '#ef4444' : '#10b981' },
                    { label: 'Write-offs — Q1', value: formatRWF(trend.writeoff_q1) },
                    { label: 'Write-offs — Q3', value: formatRWF(trend.writeoff_q3) },
                  ].map(({ label, value, highlight }) => (
                    <StatRow key={label} label={label} value={value} highlight={highlight} />
                  ))}
                  <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {(trend.par30_q3 || 0) > (trend.par30_q1 || 0)
                      ? <span style={{ color: '#ef4444' }}>⚠ PAR 30 increased by {formatPct((trend.par30_q3 || 0) - (trend.par30_q1 || 0))} from Q1 to Q3.</span>
                      : <span style={{ color: '#10b981' }}>✓ PAR 30 improved by {formatPct((trend.par30_q1 || 0) - (trend.par30_q3 || 0))} from Q1 to Q3.</span>
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Branch Performance Table */}
            {branchReport && branchReport.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} color="var(--violet)" /> Branch Performance Report
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Province</th>
                        <th>Total Loans</th>
                        <th>Outstanding</th>
                        <th>PAR 30 Rate</th>
                        <th>NPL Rate</th>
                        <th>Clients</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchReport.map((b, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, fontSize: 12 }}>{b.branch || b.name}</td>
                          <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.province}</td>
                          <td style={{ fontSize: 12 }}>{(b.total_loans || 0).toLocaleString()}</td>
                          <td style={{ fontSize: 12 }}>{formatRWF(b.total_outstanding)}</td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 700, color: (b.par30_rate || 0) > 15 ? '#ef4444' : (b.par30_rate || 0) > 10 ? '#f59e0b' : '#10b981' }}>
                              {formatPct(b.par30_rate)}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, fontWeight: 600, color: (b.npl_rate || 0) > 5 ? '#ef4444' : '#10b981' }}>{formatPct(b.npl_rate)}</td>
                          <td style={{ fontSize: 12 }}>{(b.total_clients || b.client_count || 0).toLocaleString()}</td>
                          <td><span className={`badge badge-${b.risk_level || 'medium'}`}>{b.risk_level || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
