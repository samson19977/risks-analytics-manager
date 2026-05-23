'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Brain, Sparkles, Send, RefreshCw } from 'lucide-react'

const CONTEXTS = [
  { value: 'portfolio_review', label: 'Portfolio Review', desc: 'Overall portfolio health & risk trends' },
  { value: 'early_warning', label: 'Early Warning Signals', desc: 'Detect emerging risks before they escalate' },
  { value: 'branch_risk', label: 'Branch Risk Analysis', desc: 'Compare branch performance & risk levels' },
  { value: 'client_risk', label: 'Client Risk Assessment', desc: 'High-risk client patterns & recommendations' },
]

export default function AIInsightsPage() {
  const [context, setContext] = useState('portfolio_review')

  const { data: quickInsightsData, isLoading: qLoading } = useQuery({
    queryKey: ['quick-insights'],
    queryFn: () => api.get('/api/ai/quick-insights').then(r => r.data),
  })

  const analyze = useMutation({
    mutationFn: (ctx) => api.post('/api/ai/analyze', { context: ctx }).then(r => r.data),
  })

  const handleGenerate = () => {
    analyze.mutate(context)
  }

  const quickInsights = quickInsightsData?.insights || []

  const typeColor = (type) => {
    if (type === 'alert') return '#ef4444'
    if (type === 'warning') return '#f59e0b'
    if (type === 'positive') return '#10b981'
    return '#3b82f6'
  }

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={24} color="var(--violet)" /> AI Risk Insights
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Claude-powered portfolio analysis and recommendations</p>
        </div>

        {/* Quick Insights */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="var(--amber)" /> Live Portfolio Signals
          </h2>
          {qLoading ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              Loading signals...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quickInsights.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No signals available.</p>
              )}
              {quickInsights.map((insight, i) => (
                <div key={i} style={{
                  padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 8,
                  borderLeft: `3px solid ${typeColor(insight.type)}`,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {insight.type === 'alert' ? '🚨' : insight.type === 'warning' ? '⚠️' : insight.type === 'positive' ? '✅' : 'ℹ️'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{insight.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Generator */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={14} color="var(--violet)" /> Generate AI Analysis
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 18 }}>
            {CONTEXTS.map(c => (
              <div
                key={c.value}
                onClick={() => setContext(c.value)}
                style={{
                  padding: '12px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${context === c.value ? 'var(--violet)' : 'var(--border)'}`,
                  background: context === c.value ? 'rgba(139,92,246,0.08)' : 'var(--bg-3)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: context === c.value ? 'var(--violet)' : 'var(--text)', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{c.desc}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={analyze.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: analyze.isPending ? 'not-allowed' : 'pointer',
              background: analyze.isPending ? 'var(--bg-3)' : 'var(--violet)',
              color: analyze.isPending ? 'var(--text-3)' : '#fff', fontSize: 13, fontWeight: 600,
            }}
          >
            {analyze.isPending
              ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--text-3)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> Analyzing...</>
              : <><Send size={14} /> Generate Analysis</>
            }
          </button>
        </div>

        {/* AI Result */}
        {analyze.isPending && (
          <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 24, borderColor: 'rgba(139,92,246,0.3)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--violet)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text)' }}>Claude is analysing your portfolio...</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>This takes a few seconds</p>
          </div>
        )}

        {analyze.data && !analyze.isPending && (
          <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.02))', borderColor: 'rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={14} color="var(--violet)" /> AI Recommendation
              </h2>
              <button
                onClick={handleGenerate}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8, color: 'var(--text-2)' }}>
              {analyze.data.recommendation || analyze.data.response || 'No response received.'}
            </div>
          </div>
        )}

        {analyze.isError && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
            <p style={{ fontSize: 13, color: '#ef4444' }}>Analysis failed. Please try again.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
