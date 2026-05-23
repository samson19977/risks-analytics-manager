import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, branches] = await Promise.all([
      supabaseQuery('loans', { select: 'branch_id,sector,par_days,outstanding_balance,status' }),
      supabaseQuery('branches', { select: 'id,name,province' }),
    ])
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b]))
    const heatmap = {}

    for (const l of loans) {
      const bid = l.branch_id; const sector = l.sector || 'other'
      if (!bid) continue
      const key = `${bid}__${sector}`
      if (!heatmap[key]) heatmap[key] = { bid, sector, count: 0, amount: 0, par_count: 0 }
      heatmap[key].count += 1
      heatmap[key].amount += parseFloat(l.outstanding_balance || 0)
      if ((l.par_days || 0) > 30) heatmap[key].par_count += 1
    }

    const result = Object.values(heatmap).map(d => {
      const b = branchMap[d.bid] || {}
      const parRate = d.count ? d.par_count / d.count * 100 : 0
      return {
        branch: b.name || d.bid, province: b.province || '', sector: d.sector,
        loan_count: d.count, amount: d.amount, par_rate: +parRate.toFixed(2),
        risk_level: parRate > 15 ? 'critical' : parRate > 10 ? 'high' : parRate > 5 ? 'medium' : 'low',
      }
    })
    return NextResponse.json(result.sort((a, b) => b.par_rate - a.par_rate))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
