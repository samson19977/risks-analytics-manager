import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { par_shock = 1.5, npl_multiplier = 1.3, default_rate_increase = 0.05, scenario_name = 'Custom' } = body

    const loans = await supabaseQuery('loans', { select: 'outstanding_balance,par_days,status,principal_amount' })
    const n = loans.length || 1
    const totalPortfolio = loans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    const currentPar30 = loans.filter(l => (l.par_days || 0) > 30).length / n * 100
    const currentNpl = loans.filter(l => ['npl', 'written_off'].includes(l.status)).length / n * 100

    const stressedPar30 = Math.min(100, currentPar30 * par_shock)
    const stressedNpl = Math.min(100, currentNpl * npl_multiplier)
    const additionalDefaults = totalPortfolio * default_rate_increase
    const capitalImpact = additionalDefaults * 0.4

    return NextResponse.json({
      scenario_name, baseline: { par_30: +currentPar30.toFixed(2), npl_ratio: +currentNpl.toFixed(2), total_portfolio: totalPortfolio },
      stressed: { par_30: +stressedPar30.toFixed(2), npl_ratio: +stressedNpl.toFixed(2), additional_defaults: additionalDefaults, capital_impact: capitalImpact },
      impact_summary: {
        par_30_increase: +(stressedPar30 - currentPar30).toFixed(2),
        npl_increase: +(stressedNpl - currentNpl).toFixed(2),
        capital_at_risk: capitalImpact,
        severity: capitalImpact > totalPortfolio * 0.15 ? 'critical' : capitalImpact > totalPortfolio * 0.08 ? 'high' : 'medium',
      }
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
