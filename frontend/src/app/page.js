'use client'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ClientDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get(`/api/clients/${id}`).then(r => r.data),
  })

  const client = data?.client || {}
  const loans = data?.loans || []
  const payments = data?.payments || []

  return (
    <DashboardLayout>
      <div className="fade-in">
        <Link href="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Clients
        </Link>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                {client.full_name}
              </h1>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{client.client_code}</span>
                {client.risk_category && <span className={`badge badge-${client.risk_category}`}>{client.risk_category}</span>}
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{client.branches?.name}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Client Info */}
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Client Information</h2>
                {[
                  ['Phone', client.phone],
                  ['National ID', client.national_id],
                  ['Gender', client.gender],
                  ['Loan Cycles', client.loan_cycles],
                  ['Risk Score', client.risk_score?.toFixed(0)],
                  ['Member Since', client.created_at?.slice(0, 10)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Loans */}
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Loans ({loans.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {loans.slice(0, 5).map(l => (
                    <div key={l.id} style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{l.loan_number}</span>
                        <span className={`badge badge-${l.status === 'active' ? 'medium' : l.status === 'npl' ? 'critical' : 'low'}`}>{l.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        Outstanding: {formatRWF(l.outstanding_balance)} · PAR: {l.par_days || 0}d
                      </div>
                    </div>
                  ))}
                  {loans.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No loans found</p>}
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Recent Payments</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount Due</th>
                    <th>Amount Paid</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((p, i) => (
                    <tr key={i}>
                      <td>{p.payment_date}</td>
                      <td>{formatRWF(p.amount_due)}</td>
                      <td>{formatRWF(p.amount_paid)}</td>
                      <td>{p.payment_method || '—'}</td>
                      <td>
                        <span className={`badge badge-${p.is_late ? 'high' : 'low'}`}>
                          {p.is_late ? `Late ${p.days_late}d` : 'On time'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>No payments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
