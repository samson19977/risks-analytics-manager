import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, alerts] = await Promise.all([
      supabaseQuery('loans', { select: 'outstanding_balance,par_days,status', limit: 500 }),
      supabaseQuery('risk_alerts', { select: 'severity,is_resolved', filters: [['is_resolved', 'eq', false]] }),
    ])
    const n = loans.length || 1
    const par30Rate = (loans.filter(l => (l.par_days || 0) > 30).length / n * 100).toFixed(1)
    const nplRate = (loans.filter(l => ['npl', 'written_off'].includes(l.status)).length / n * 100).toFixed(1)
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

    const insights = []
    if (parseFloat(par30Rate) > 10) insights.push({ type: 'warning', message: `PAR>30 is at ${par30Rate}% — above the 10% threshold. Review high-risk branches.` })
    else insights.push({ type: 'positive', message: `PAR>30 at ${par30Rate}% is within acceptable range.` })
    if (parseFloat(nplRate) > 5) insights.push({ type: 'alert', message: `NPL ratio of ${nplRate}% requires immediate attention.` })
    if (criticalAlerts > 0) insights.push({ type: 'alert', message: `${criticalAlerts} critical unresolved alerts need action.` })
    if (insights.length < 3) insights.push({ type: 'info', message: 'Portfolio performance is within normal parameters.' })

    return NextResponse.json({ insights, generated_at: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ insights: [], error: e.message })
  }
}
