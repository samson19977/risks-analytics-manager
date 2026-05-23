import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, branches] = await Promise.all([
      supabaseQuery('loans', { select: 'id,loan_number,client_id,branch_id,disbursement_date,principal_amount,par_days,status,outstanding_balance' }),
      supabaseQuery('branches', { select: 'id,name' }),
    ])
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b.name]))
    const signals = []

    // Month-end disbursement spikes
    const byDay = {}
    for (const l of loans) {
      if (l.disbursement_date) {
        if (!byDay[l.disbursement_date]) byDay[l.disbursement_date] = []
        byDay[l.disbursement_date].push(l)
      }
    }
    for (const [day, dayLoans] of Object.entries(byDay)) {
      const d = new Date(day)
      if (d.getDate() >= 28 && dayLoans.length > 5) {
        const byBranch = {}
        for (const l of dayLoans) {
          if (l.branch_id) { if (!byBranch[l.branch_id]) byBranch[l.branch_id] = []; byBranch[l.branch_id].push(l) }
        }
        for (const [bid, bLoans] of Object.entries(byBranch)) {
          if (bLoans.length >= 3) {
            signals.push({
              signal_type: 'month_end_disbursement_spike', severity: 'high',
              description: `Unusual ${bLoans.length} disbursements on ${day} (month-end) at ${branchMap[bid] || 'Unknown'}`,
              branch_name: branchMap[bid] || 'Unknown',
              details: { date: day, count: bLoans.length, total_amount: bLoans.reduce((s, l) => s + parseFloat(l.principal_amount || 0), 0) }
            })
          }
        }
      }
    }

    // Multiple active loans per client
    const clientLoans = {}
    for (const l of loans) {
      if (l.client_id && l.status === 'active') {
        if (!clientLoans[l.client_id]) clientLoans[l.client_id] = []
        clientLoans[l.client_id].push(l)
      }
    }
    for (const [cid, cLoans] of Object.entries(clientLoans)) {
      if (cLoans.length >= 2) {
        const bid = cLoans[0].branch_id
        signals.push({
          signal_type: 'multiple_active_loans', severity: cLoans.length >= 3 ? 'critical' : 'high',
          description: `Client has ${cLoans.length} simultaneous active loans`,
          branch_name: branchMap[bid] || 'Unknown',
          details: { client_id: cid, loan_count: cLoans.length, total_exposure: cLoans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0) }
        })
      }
    }

    return NextResponse.json(signals)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
