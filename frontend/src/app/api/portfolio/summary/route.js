import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, clients] = await Promise.all([
      supabaseQuery('loans', { select: 'outstanding_balance,par_days,status,write_off_amount,restructured,principal_amount' }),
      supabaseQuery('clients', { select: 'risk_category,is_active,branch_id' }),
    ])

    const totalPortfolio = loans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    const activeLoans = loans.filter(l => l.status === 'active')
    const par30 = loans.filter(l => (l.par_days || 0) > 30)
    const par60 = loans.filter(l => (l.par_days || 0) > 60)
    const npl = loans.filter(l => ['npl', 'written_off'].includes(l.status))
    const restructured = loans.filter(l => l.restructured)
    const writtenOff = loans.filter(l => l.status === 'written_off')

    const par30Amount = par30.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    const nplAmount = npl.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)

    const riskDist = {}
    for (const c of clients) {
      const cat = c.risk_category || 'medium'
      riskDist[cat] = (riskDist[cat] || 0) + 1
    }

    const n = loans.length || 1

    return NextResponse.json({
      gross_loan_portfolio: totalPortfolio,
      active_loans: activeLoans.length,
      total_clients: clients.filter(c => c.is_active !== false).length,
      par_30_count: par30.length,
      par_30_pct: loans.length ? +((par30.length / n) * 100).toFixed(2) : 0,
      par_30_amount: par30Amount,
      par_60_pct: loans.length ? +((par60.length / n) * 100).toFixed(2) : 0,
      npl_ratio: loans.length ? +((npl.length / n) * 100).toFixed(2) : 0,
      npl_amount: nplAmount,
      restructured_loans: restructured.length,
      restructured_pct: loans.length ? +((restructured.length / n) * 100).toFixed(2) : 0,
      write_offs_total: writtenOff.reduce((s, l) => s + parseFloat(l.write_off_amount || 0), 0),
      portfolio_risk_score: loans.length ? Math.min(100, ((par30.length / n) * 40 + (npl.length / n) * 60) * 100) : 0,
      risk_distribution: riskDist,
      collection_rate: totalPortfolio ? +((1 - par30Amount / totalPortfolio) * 100).toFixed(2) : 0,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
