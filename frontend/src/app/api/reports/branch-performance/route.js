import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [branches, loans, clients] = await Promise.all([
      supabaseQuery('branches', { select: '*' }),
      supabaseQuery('loans', { select: 'branch_id,outstanding_balance,par_days,status,principal_amount' }),
      supabaseQuery('clients', { select: 'branch_id,id,risk_category' }),
    ])

    const stats = {}
    for (const l of loans) {
      const bid = l.branch_id; if (!bid) continue
      if (!stats[bid]) stats[bid] = { total: 0, outstanding: 0, par30: 0, active: 0, npl: 0, disbursed: 0 }
      stats[bid].total += 1
      stats[bid].outstanding += parseFloat(l.outstanding_balance || 0)
      stats[bid].disbursed += parseFloat(l.principal_amount || 0)
      if ((l.par_days || 0) > 30) stats[bid].par30 += 1
      if (l.status === 'active') stats[bid].active += 1
      if (['npl', 'written_off'].includes(l.status)) stats[bid].npl += 1
    }
    const clientStats = {}
    for (const c of clients) {
      const bid = c.branch_id; if (!bid) continue
      if (!clientStats[bid]) clientStats[bid] = 0
      clientStats[bid] += 1
    }

    return NextResponse.json(branches.map(b => {
      const s = stats[b.id] || { total: 0, outstanding: 0, par30: 0, active: 0, npl: 0, disbursed: 0 }
      const par30Rate = s.total ? +(s.par30 / s.total * 100).toFixed(2) : 0
      return {
        branch_id: b.id, branch_name: b.name, province: b.province,
        total_loans: s.total, active_loans: s.active, total_outstanding: s.outstanding,
        par30_rate: par30Rate, par30_count: s.par30, npl_count: s.npl,
        total_clients: clientStats[b.id] || 0,
        performance: par30Rate < 3 ? 'excellent' : par30Rate < 6 ? 'good' : par30Rate < 10 ? 'warning' : 'poor',
      }
    }))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
