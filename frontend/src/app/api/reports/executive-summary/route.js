import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, clients, alerts, branches] = await Promise.all([
      supabaseQuery('loans', { select: 'outstanding_balance,par_days,status,write_off_amount,branch_id,sector,principal_amount' }),
      supabaseQuery('clients', { select: 'risk_category,is_active,branch_id' }),
      supabaseQuery('risk_alerts', { select: 'severity,is_resolved,alert_type,branches(name)', filters: [['is_resolved', 'eq', false]], order: 'created_at.desc', limit: 10 }),
      supabaseQuery('branches', { select: 'id,name' }),
    ])

    const n = loans.length || 1
    const total = loans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    const activeLoans = loans.filter(l => l.status === 'active')
    const par30 = loans.filter(l => (l.par_days || 0) > 30)
    const npl = loans.filter(l => ['npl', 'written_off'].includes(l.status))
    const writtenOff = loans.filter(l => l.status === 'written_off')
    const par30Amount = par30.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)

    const riskDist = {}
    for (const c of clients) { const k = c.risk_category || 'medium'; riskDist[k] = (riskDist[k] || 0) + 1 }

    const unresolvedAlerts = alerts.filter(a => !a.is_resolved)

    return NextResponse.json({
      portfolio_overview: {
        gross_loan_portfolio: total,
        active_loans: activeLoans.length,
        active_clients: clients.filter(c => c.is_active !== false).length,
        branches: branches.length,
      },
      risk_metrics: {
        par30_pct: +((par30.length / n) * 100).toFixed(2),
        par30_amount: par30Amount,
        npl_pct: +((npl.length / n) * 100).toFixed(2),
        write_offs: writtenOff.reduce((s, l) => s + parseFloat(l.write_off_amount || 0), 0),
      },
      risk_distribution: riskDist,
      alerts: {
        critical: unresolvedAlerts.filter(a => a.severity === 'critical').length,
        high: unresolvedAlerts.filter(a => a.severity === 'high').length,
        unresolved: unresolvedAlerts.length,
      },
      top_alerts: alerts.slice(0, 5),
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
