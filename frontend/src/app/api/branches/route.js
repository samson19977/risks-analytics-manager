import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [branches, loans, clients] = await Promise.all([
      supabaseQuery('branches', { select: '*', order: 'name' }),
      supabaseQuery('loans', { select: 'branch_id,outstanding_balance,par_days,status' }),
      supabaseQuery('clients', { select: 'branch_id,id' }),
    ])

    const stats = {}
    for (const l of loans) {
      const bid = l.branch_id
      if (!bid) continue
      if (!stats[bid]) stats[bid] = { total_loans: 0, total_outstanding: 0, par30_count: 0, total_clients: 0 }
      stats[bid].total_loans += 1
      stats[bid].total_outstanding += parseFloat(l.outstanding_balance || 0)
      if ((l.par_days || 0) > 30) stats[bid].par30_count += 1
    }
    for (const c of clients) {
      const bid = c.branch_id
      if (bid) { if (!stats[bid]) stats[bid] = { total_loans: 0, total_outstanding: 0, par30_count: 0, total_clients: 0 }; stats[bid].total_clients += 1 }
    }

    const enriched = branches.map(b => {
      const s = stats[b.id] || { total_loans: 0, total_outstanding: 0, par30_count: 0, total_clients: 0 }
      const par30Rate = s.total_loans ? +(s.par30_count / s.total_loans * 100).toFixed(2) : 0
      return { ...b, ...s, par30_rate: par30Rate, portfolio_size: s.total_outstanding, loan_count: s.total_loans, client_count: s.total_clients, manager: b.manager_name }
    })
    return NextResponse.json(enriched)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
