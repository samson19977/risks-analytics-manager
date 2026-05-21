'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import { Zap } from 'lucide-react'

export default function StressTestPage() {
  const [result, setResult] = useState(null)

  const { data: scenarios } = useQuery({
    queryKey: ['stress-scenarios'],
    queryFn: () => api.get('/api/stress-test/predefined-scenarios').then(r => r.data),
  })

  const { data: history } = useQuery({
    queryKey: ['stress-history'],
    queryFn: () => api.get('/api/stress-test/history').then(r => r.data),
  })

  const runTest = useMutation({
    mutationFn: (scenario) => api.post('/api/stress-test/run', scenario).then(r => r.data),
    onSuccess: (data) => setResult(data),
  })

  const handleRunScenario = (scenario) => {
    runTest.mutate({
      scenario_name: scenario.name,
      scenario_type: scenario.type,
      fuel_price_increase: scenario.params.fuel_price_increase || 0,
      food_inflation: scenario.params.food_inflation || 0,
      income_shock: scenario.params.income_shock || 0,
      sector_affected: scenario.params.sector_affected || null,
      global_par_multiplier: scenario.params.global_par_multiplier || 1,
    })
  }

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>Stress Testing</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Simulate adverse scenarios and measure portfolio impact</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          {(scenarios || []).map((s) => (
            <div key={s.name} className="card" style={{ padding: 18, cursor: 'pointer' }} onClick={() => handleRunScenario(s)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Zap size={18} color="var(--amber)" />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>{s.description}</p>
              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>Run Scenario</button>
            </div>
          ))}
        </div>

        {runTest.isPending && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p>Running stress simulation...</p>
          </div>
        )}

        {result && (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{result.scenario_name} - Results</h2>
            <div style={{ background: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontWeight: 600 }}>Risk Rating: </span>
              <span style={{ color: '#ef4444' }}>{result.risk_rating}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-2)' }}>Baseline</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid var(--border-2)' }}>
                  <span>PAR 30</span><span>{formatPct(result.baseline.par30_pct)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid var(--border-2)' }}>
                  <span>NPL Ratio</span><span>{formatPct(result.baseline.npl_pct)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid var(--border-2)' }}>
                  <span>Portfolio</span><span>{formatRWF(result.baseline.total_portfolio)}</span>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#ef4444' }}>Stressed</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid var(--border-2)' }}>
                  <span>PAR 30</span><span style={{ color: '#ef4444' }}>{formatPct(result.stressed.par30_pct)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid var(--border-2)' }}>
                  <span>NPL Ratio</span><span style={{ color: '#ef4444' }}>{formatPct(result.stressed.npl_pct)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid var(--border-2)' }}>
                  <span>Additional Risk</span><span style={{ color: '#f59e0b' }}>{formatRWF(result.stressed.additional_at_risk)}</span>
                </div>
              </div>
            </div>
            {result.recommendations && (
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-3)', borderRadius: 8 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Recommendations</h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: 'var(--text-2)' }}>
                  {result.recommendations.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}