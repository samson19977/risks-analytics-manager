'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import { GitBranch, MapPin, Users, TrendingUp } from 'lucide-react'

function BranchCard({ branch, onClick }) {
  const parRate = branch.par30_rate || 0
  const color = parRate > 15 ? '#ef4444' : parRate > 10 ? '#f59e0b' : parRate > 5 ? '#3b82f6' : '#10b981'
  return (
    <div className="card" style={{ padding: 20, cursor: 'pointer', transition: 'transform 0.15s' }}
      onClick={() => onClick(branch)}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{branch.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: 'var(--text-3)' }}>
            <MapPin size={10} /> {branch.province}
          </div>
        </div>
        <div style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}44` }}>
          PAR {formatPct(parRate)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
        {[
          { label: 'Portfolio', value: formatRWF(branch.total_outstanding || branch.portfolio_size) },
          { label: 'Loans', value: (branch.total_loans || branch.loan_count || 0).toLocaleString() },
          { label: 'Clients', value: (branch.total_clients || branch.client_count || 0).toLocaleString() },
          { label: 'Manager', value: branch.manager || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BranchesPage() {
  const [selected, setSelected] = useState(null)

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/api/branches/').then(r => r.data),
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['branch-detail', selected?.id],
    queryFn: () => api.get(`/api/branches/${selected.id}`).then(r => r.data),
    enabled: !!selected,
  })

  const { data: performance } = useQuery({
    queryKey: ['branch-perf', selected?.id],
    queryFn: () => api.get(`/api/branches/${selected.id}/performance`).then(r => r.data),
    enabled: !!selected,
  })

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={22} color="var(--blue)" /> Branch Analytics
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Performance overview across all AB Rwanda branches</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
            {/* Branch Grid */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {(branches || []).map(b => (
                  <BranchCard key={b.id} branch={b} onClick={setSelected} />
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            {selected && (
              <div className="card" style={{ padding: 20, alignSelf: 'start', position: 'sticky', top: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{selected.name}</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{selected.province} Province</p>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-3)', cursor: 'pointer' }}>✕</button>
                </div>

                {detailLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : detail && (
                  <>
                    {[
                      ['Total Portfolio', formatRWF(detail.loan_summary?.total_outstanding)],
                      ['Total Loans', detail.loan_summary?.total_loans],
                      ['PAR > 30 Loans', detail.loan_summary?.par_loans],
                      ['Active Clients', detail.total_clients],
                      ['PAR 30 Rate', formatPct(performance?.par30_rate)],
                      ['PAR 30 Amount', formatRWF(performance?.par30_amount)],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-3)' }}>{label}</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value ?? '—'}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
