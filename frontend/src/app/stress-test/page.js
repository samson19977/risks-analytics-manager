'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import { Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

const SCENARIO_ICONS = { macro_shock: '🌐', sector_shock: '🌾', custom: '⚙️' }
const RISK_COLORS = { CRITICAL: '#ef4444', HIGH: '#f59e0b', ELEVATED: '#3b82f6', MODERATE: '#10b981' }

export default function StressTestPage() {
  const [result, setResult] = useState(null)
  const [activeScenario, setActiveScenario] = useState(null)

  const { data: scenarios, isLoading: scenariosLoading } = useQuery({
    queryKey: ['stress-scenarios'],
    queryFn: () => api.get('/api/stress-test/predefined-scenarios').then(r => r.data),
  })

  const { data: history } = useQuery({
    queryKey: ['stress-history'],
    queryFn: () => api.get('/api/stress-test/history').then(r => r.data),
  })

  const runTest = useMutation({
    mutationFn: (scenario) => api.post('/api/stress-test/run', scenario).then(r => r.data),
    onSuccess: (data) => { setResult(data); setActiveScenario(null) },
  })

  const handleRunScenario = (scenario) => {
    setActiveScenario(scenario.name)
    setResult(null)
    runTest.mutate({
      scenario_name: scenario.name,
      scenario_type: scenario.type,
      fuel_price_increase: scenario.params.fuel_price_increase || 0,
      food_inflation: scenario.params.food_inflation || 0,
      income_shock: scenario.params.income_shock || 0,
      sector_affected: scenario.params.sector_affected || null,
      sector_par_multiplier: scenario.params.sector_par_multiplier || 1.0,
      global_par_multiplier: scenario.params.global_par_multiplier || 1,
    })
  }

  const riskColor = result ? RISK_COLORS[result.risk_rating] || '#3b82f6' : '#3b82f6'

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={22} color="var(--amber)" /> Stress Testing
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            Simulate adverse scenarios and measure portfolio impact
          </p>
        </div>

        {/* Scenario Cards */}
        {scenariosLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
            {(scenarios || []).map((s) => {
              const isRunning = runTest.isPending && activeScenario === s.name
              return (
                <div key={s.name} className="card" style={{
                  padding: 18, cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s',
                  borderColor: activeScenario === s.name ? 'var(--amber)' : 'var(--border)',
                }}
                  onClick={() => !runTest.isPending && handleRunScenario(s)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{SCENARIO_ICONS[s.type] || '⚡'}</span>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.name}</h3>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'var(--bg-3)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                      {s.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>{s.description}</p>

                  {/* Scenario params preview */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {s.params.fuel_price_increase > 0 && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        ⛽ +{s.params.fuel_price_increase}% fuel
                      </span>
                    )}
                    {s.params.food_inflation > 0 && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        🌾 +{s.params.food_inflation}% food
                      </span>
                    )}
                    {s.params.income_shock > 0 && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        💰 -{s.params.income_shock}% income
                      </span>
                    )}
                    {s.params.sector_affected && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        🏭 {s.params.sector_affected}
                      </span>
                    )}
                  </div>

                  <button
                    style={{
                      width: '100%', padding: '7px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                      background: isRunning ? 'var(--bg-3)' : 'var(--blue)', color: isRunning ? 'var(--text-3)' : '#fff',
                      border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {isRunning ? 'Running...' : 'Run Scenario →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Running State */}
        {runTest.isPending && (
          <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 24, borderColor: 'rgba(245,158,11,0.3)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--amber)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text)' }}>Running stress simulation...</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Analysing portfolio against {activeScenario}</p>
          </div>
        )}

        {/* Results */}
        {result && !runTest.isPending && (
          <div className="card" style={{ padding: 24, marginBottom: 28, borderColor: `${riskColor}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                  {result.scenario_name} — Results
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Macro shock contribution: +{result.macro_shock_contribution?.toFixed(1)}% PAR
                </p>
              </div>
              <div style={{
                padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                background: `${riskColor}18`, color: riskColor, border: `1px solid ${riskColor}44`
              }}>
                {result.risk_rating}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Baseline */}
              <div style={{ padding: 16, background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                  📊 Baseline (Current)
                </h3>
                {[
                  ['PAR 30', formatPct(result.baseline.par30_pct)],
                  ['NPL Ratio', formatPct(result.baseline.npl_pct)],
                  ['Total Portfolio', formatRWF(result.baseline.total_portfolio)],
                  ['PAR 30 Amount', formatRWF(result.baseline.par30_amount)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Stressed */}
              <div style={{ padding: 16, background: `${riskColor}08`, borderRadius: 10, border: `1px solid ${riskColor}30` }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12, color: riskColor }}>
                  ⚠️ Stressed Projection
                </h3>
                {[
                  ['PAR 30', formatPct(result.stressed.par30_pct)],
                  ['NPL Ratio', formatPct(result.stressed.npl_pct)],
                  ['Additional at Risk', formatRWF(result.stressed.additional_at_risk)],
                  ['Capital Impact', formatRWF(result.stressed.capital_impact)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${riskColor}20`, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-2)' }}>{label}</span>
                    <span style={{ color: riskColor, fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector analysis */}
            {result.sector_analysis && result.sector_analysis.sector && (
              <div style={{ padding: 14, background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>
                  Sector Impact: {result.sector_analysis.sector}
                </h3>
                <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                  <span>Portfolio: <strong>{formatRWF(result.sector_analysis.portfolio)}</strong></span>
                  <span>Current PAR: <strong>{formatPct(result.sector_analysis.current_par_pct)}</strong></span>
                  <span>Stressed PAR: <strong style={{ color: '#ef4444' }}>{formatPct(result.sector_analysis.stressed_par_pct)}</strong></span>
                  <span>Additional at Risk: <strong style={{ color: '#f59e0b' }}>{formatRWF(result.sector_analysis.additional_at_risk)}</strong></span>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div style={{ padding: 16, background: 'var(--bg-3)', borderRadius: 8 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} color="var(--amber)" /> Recommended Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.recommendations.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--blue)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history && history.length > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Recent Tests</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Type</th>
                  <th>PAR Stressed</th>
                  <th>Rating</th>
                  <th>Run By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map(h => {
                  const rating = h.results?.risk_rating || '—'
                  const rc = RISK_COLORS[rating] || 'var(--text-3)'
                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{h.scenario_name}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{h.scenario_type}</td>
                      <td style={{ fontSize: 12 }}>{formatPct(h.results?.stressed?.par30_pct)}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color: rc }}>{rating}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{h.created_by || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{h.created_at?.slice(0, 10)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
