'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import { Users, Search, Filter, ChevronRight, AlertTriangle } from 'lucide-react'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', page, riskFilter, search],
    queryFn: () => api.get('/api/clients/', {
      params: { page, limit: 50, risk_category: riskFilter || undefined, search: search || undefined }
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: highRisk } = useQuery({
    queryKey: ['high-risk-clients'],
    queryFn: () => api.get('/api/clients/high-risk').then(r => r.data),
  })

  const riskOptions = ['', 'critical', 'high', 'medium', 'low']

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={22} color="var(--blue)" /> Clients
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Client portfolio and risk profiles</p>
        </div>

        {/* High Risk Banner */}
        {highRisk && highRisk.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 20, borderColor: 'rgba(239,68,68,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{highRisk.length} High-Risk Clients Require Attention</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {highRisk.slice(0, 6).map(c => (
                <Link key={c.id} href={`/clients/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 11, color: '#ef4444', cursor: 'pointer' }}>
                    {c.full_name}
                  </div>
                </Link>
              ))}
              {highRisk.length > 6 && <span style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 0' }}>+{highRisk.length - 6} more</span>}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search clients..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {riskOptions.map(r => (
              <button key={r} onClick={() => { setRiskFilter(r); setPage(1) }}
                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                  background: riskFilter === r ? 'var(--blue)' : 'var(--surface)',
                  borderColor: riskFilter === r ? 'var(--blue)' : 'var(--border)',
                  color: riskFilter === r ? '#fff' : 'var(--text-3)',
                }}>
                {r || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Client Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Code</th>
                  <th>Branch</th>
                  <th>Risk</th>
                  <th>Risk Score</th>
                  <th>Loan Cycles</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(clients || []).map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{c.full_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{c.phone}</div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-3)' }}>{c.client_code}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.branches?.name || '—'}</td>
                    <td><span className={`badge badge-${c.risk_category}`}>{c.risk_category}</span></td>
                    <td style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.risk_score?.toFixed(0) ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.loan_cycles ?? '—'}</td>
                    <td>
                      <Link href={`/clients/${c.id}`} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-3)', textDecoration: 'none' }}>
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!clients || clients.length === 0) && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No clients found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, opacity: page === 1 ? 0.4 : 1 }}>
            Previous
          </button>
          <span style={{ padding: '6px 14px', fontSize: 12, color: 'var(--text-3)' }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!clients || clients.length < 50}
            style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, opacity: (!clients || clients.length < 50) ? 0.4 : 1 }}>
            Next
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
