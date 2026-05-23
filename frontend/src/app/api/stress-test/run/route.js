import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      scenario_name = 'Custom', scenario_type = 'macro_shock',
      par_shock = 1.5, npl_multiplier = 1.3, default_rate_increase = 0.05,
      sector_affected = null, sector_par_multiplier = 1.0,
    } = body

    const loans = await supabaseQuery('loans', {
      select: 'outstanding_balance,par_days,status,principal_amount,sector'
    })

    const n = loans.length || 1
    const totalPortfolio = loans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    const par30Loans = loans.filter(l => (l.par_days || 0) > 30)
    const nplLoans = loans.filter(l => ['npl', 'written_off'].includes(l.status))
    const currentPar30Pct = par30Loans.length / n * 100
    const currentNplPct = nplLoans.length / n * 100
    const par30Amount = par30Loans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)

    const stressedPar30 = Math.min(100, currentPar30Pct * par_shock)
    const stressedNpl = Math.min(100, currentNplPct * npl_multiplier)
    const additionalAtRisk = totalPortfolio * default_rate_increase
    const capitalImpact = additionalAtRisk * 0.4

    // Sector analysis
    let sectorAnalysis = null
    if (sector_affected) {
      const sectorLoans = loans.filter(l => (l.sector || '').toLowerCase() === sector_affected.toLowerCase())
      const sectorPortfolio = sectorLoans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
      const sectorPar = sectorLoans.filter(l => (l.par_days || 0) > 30)
      const sectorParPct = sectorLoans.length ? sectorPar.length / sectorLoans.length * 100 : 0
      const stressedSectorPar = Math.min(100, sectorParPct * sector_par_multiplier)
      sectorAnalysis = {
        sector: sector_affected,
        portfolio: sectorPortfolio,
        loan_count: sectorLoans.length,
        current_par_pct: +sectorParPct.toFixed(2),
        stressed_par_pct: +stressedSectorPar.toFixed(2),
        additional_at_risk: +(sectorPortfolio * (stressedSectorPar - sectorParPct) / 100).toFixed(0),
      }
    }

    const capitalRatio = totalPortfolio ? capitalImpact / totalPortfolio : 0
    const riskRating = capitalRatio > 0.15 ? 'CRITICAL' : capitalRatio > 0.08 ? 'HIGH' : capitalRatio > 0.04 ? 'ELEVATED' : 'MODERATE'

    const recommendations = []
    if (stressedPar30 > 15) recommendations.push('Immediately review and tighten disbursement criteria for new loans')
    if (stressedPar30 > 10) recommendations.push('Increase collection team capacity and field visit frequency')
    if (sector_affected) recommendations.push(`Reduce concentration in ${sector_affected} sector — cap new lending at 20% of portfolio`)
    if (stressedNpl > 8) recommendations.push('Activate loan restructuring programme for at-risk clients')
    recommendations.push('Strengthen early warning system monitoring for leading PAR indicators')
    if (capitalImpact > totalPortfolio * 0.05) recommendations.push('Review capital adequacy and consider provisioning increase')

    return NextResponse.json({
      scenario_name,
      scenario_type,
      risk_rating: riskRating,
      macro_shock_contribution: +(stressedPar30 - currentPar30Pct).toFixed(1),
      baseline: {
        par30_pct: +currentPar30Pct.toFixed(2),
        npl_pct: +currentNplPct.toFixed(2),
        total_portfolio: totalPortfolio,
        par30_amount: par30Amount,
      },
      stressed: {
        par30_pct: +stressedPar30.toFixed(2),
        npl_pct: +stressedNpl.toFixed(2),
        additional_at_risk: additionalAtRisk,
        capital_impact: capitalImpact,
      },
      sector_analysis: sectorAnalysis,
      recommendations,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
