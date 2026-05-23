import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const loans = await supabaseQuery('loans', { select: 'sector,outstanding_balance,par_days,status' })
    const total = loans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    const sectorData = {}

    for (const l of loans) {
      const s = l.sector || 'other'
      if (!sectorData[s]) sectorData[s] = { amount: 0, count: 0, par_count: 0 }
      sectorData[s].amount += parseFloat(l.outstanding_balance || 0)
      sectorData[s].count += 1
      if ((l.par_days || 0) > 30) sectorData[s].par_count += 1
    }

    const result = Object.entries(sectorData).map(([sector, d]) => {
      const pct = total ? d.amount / total * 100 : 0
      const parRate = d.count ? d.par_count / d.count * 100 : 0
      return {
        sector, amount: d.amount, loan_count: d.count,
        percentage: +pct.toFixed(2), par_rate: +parRate.toFixed(2),
        risk_level: pct > 35 ? 'critical' : pct > 25 ? 'high' : pct > 15 ? 'medium' : 'low',
      }
    })
    return NextResponse.json(result.sort((a, b) => b.amount - a.amount))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
