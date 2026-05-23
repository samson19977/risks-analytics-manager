import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, branches] = await Promise.all([
      supabaseQuery('loans', { select: 'loan_officer,branch_id,par_days,outstanding_balance,status,principal_amount' }),
      supabaseQuery('branches', { select: 'id,name' }),
    ])
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b.name]))
    const officers = {}

    for (const l of loans) {
      const lo = l.loan_officer || 'Unknown'
      if (!officers[lo]) officers[lo] = { total: 0, par30: 0, portfolio: 0, disbursed: 0, npl: 0, branch_id: null }
      officers[lo].total += 1
      officers[lo].portfolio += parseFloat(l.outstanding_balance || 0)
      officers[lo].disbursed += parseFloat(l.principal_amount || 0)
      officers[lo].branch_id = l.branch_id
      if ((l.par_days || 0) > 30) officers[lo].par30 += 1
      if (['npl', 'written_off'].includes(l.status)) officers[lo].npl += 1
    }

    const result = Object.entries(officers).map(([lo, d]) => {
      const parRate = d.total ? d.par30 / d.total * 100 : 0
      return {
        loan_officer: lo, branch: branchMap[d.branch_id] || 'Unknown',
        total_loans: d.total, par_30_count: d.par30, par_30_rate: +parRate.toFixed(2),
        npl_count: d.npl, portfolio_value: d.portfolio,
        performance: parRate < 3 ? 'excellent' : parRate < 6 ? 'good' : parRate < 10 ? 'warning' : 'poor',
      }
    })
    return NextResponse.json(result.sort((a, b) => b.par_30_rate - a.par_30_rate))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
