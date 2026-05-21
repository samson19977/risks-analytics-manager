'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Brain, Sparkles, Send, Clock } from 'lucide-react'

export default function AIInsightsPage() {
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('portfolio_review')

  const { data: history } = useQuery({
    queryKey: ['ai-history'],
    queryFn: () => api.get('/api/ai-insights/history').then(r => r.data),
  })

  const { data: quickInsights } = useQuery({
    queryKey: ['quick-insights'],
    queryFn: () => api.get('/api/ai-insights/quick-insights').then(r => r.data),
  })

  const analyze = useMutation({
    mutationFn: (payload) => api.post('/api/ai-insights/analyze', payload).then(r => r.data),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!question.trim()) return
    analyze.mutate({ context, question })
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

        {quickInsights && quickInsights.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="var(--amber)" /> Quick Insights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quickInsights.map((insight, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${insight.type === 'critical' ? '#ef4444' : insight.type === 'high' ? '#f59e0b' : '#3b82f6'}` }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{insight.title}</div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>{insight.body}</p>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>→ {insight.action}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, display: 'block' }}>Analysis Context</label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
              >
                <option value="portfolio_review">Portfolio Review</option>
                <option value="early_warning">Early Warning Signals</option>
                <option value="branch_risk">Branch Risk Analysis</option>
                <option value="client_risk">Client Risk Assessment</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, display: 'block' }}>Question (optional)</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What's driving PAR deterioration in the agriculture sector?"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, resize: 'vertical' }}
              />
            </div>
            <button type="submit" disabled={analyze.isPending} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {analyze.isPending ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
              {analyze.isPending ? 'Analyzing...' : 'Generate Analysis'}
            </button>
          </form>
        </div>

        {analyze.data && (
          <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.02))' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={14} color="var(--violet)" /> AI Recommendation
            </h2>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)' }}>
              {analyze.data.recommendation}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}