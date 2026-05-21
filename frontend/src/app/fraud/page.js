'use client'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, RISK_COLORS } from '@/lib/api'
import { Shield, Scan, CheckCircle, XCircle } from 'lucide-react'

export default function FraudPage() {
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)

  const { data: signals, refetch } = useQuery({
    queryKey: ['fraud-signals'],
    queryFn: () => api.get('/api/fraud/signals').then(r => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['fraud-summary'],
    queryFn: () => api.get('/api/fraud/summary').then(r => r.data),
  })

  const runScan = async () => {
    setScanning(true)
    try {
      const res = await api.get('/api/fraud/scan')
      setScanResult(res.data)
      refetch()
    } finally {
      setScanning(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>Fraud Detection</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>AI-powered anomaly detection & fraud signal monitoring</p>
          </div>
          <button onClick={runScan} disabled={scanning} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scan size={16} /> {scanning ? 'Scanning...' : 'Run Full Scan'}
          </button>
        </div>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blue)' }}>{summary.total}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Total Signals</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{summary.critical}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Critical</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{summary.high}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>High</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-2)' }}>{summary.uninvestigated}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Uninvestigated</div>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="card" style={{ padding: 20, marginBottom: 24, borderLeft: `3px solid ${scanResult.critical > 0 ? '#ef4444' : '#10b981'}` }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Scan Results - {new Date(scanResult.scan_date).toLocaleString()}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Total signals: {scanResult.total_signals} | Critical: {scanResult.critical} | High: {scanResult.high}</p>
          </div>
        )}

        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Fraud Signals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(signals || []).map((s) => (
              <div key={s.id} style={{ padding: 14, background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${RISK_COLORS[s.severity] || 'var(--blue)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span className={`badge badge-${s.severity}`} style={{ marginRight: 8 }}>{s.severity}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.signal_type?.replace(/_/g, ' ')}</span>
                  </div>
                  {s.is_investigated ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="var(--text-3)" />}
                </div>
                <p style={{ fontSize: 13, marginBottom: 6 }}>{s.description}</p>
                {s.branch_name && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Branch: {s.branch_name}</div>}
              </div>
            ))}
            {(!signals || signals.length === 0) && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                <Shield size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div>No fraud signals detected</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}