import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const loans = await supabaseQuery('loans', {
      select: 'id,client_id,branch_id,disbursement_date,principal_amount,par_days,status,outstanding_balance,loan_officer'
    })

    let critical = 0, high = 0, medium = 0

    // Multiple active loans per client
    const clientActiveLoans = {}
    for (const l of loans) {
      if (l.client_id && l.status === 'active') {
        clientActiveLoans[l.client_id] = (clientActiveLoans[l.client_id] || 0) + 1
      }
    }
    for (const count of Object.values(clientActiveLoans)) {
      if (count >= 3) critical += 1
      else if (count >= 2) high += 1
    }

    // Month-end spikes
    const byDayBranch = {}
    for (const l of loans) {
      if (!l.disbursement_date || !l.branch_id) continue
      const d = new Date(l.disbursement_date)
      if (d.getDate() >= 26) {
        const key = `${l.disbursement_date}__${l.branch_id}`
        byDayBranch[key] = (byDayBranch[key] || 0) + 1
      }
    }
    for (const count of Object.values(byDayBranch)) {
      if (count >= 5) critical += 1
      else if (count >= 3) high += 1
    }

    // High PAR officers
    const officerStats = {}
    for (const l of loans) {
      const lo = l.loan_officer || 'Unknown'
      if (!officerStats[lo]) officerStats[lo] = { total: 0, par: 0 }
      officerStats[lo].total += 1
      if ((l.par_days || 0) > 30) officerStats[lo].par += 1
    }
    for (const stats of Object.values(officerStats)) {
      if (stats.total >= 5) {
        const rate = stats.par / stats.total * 100
        if (rate > 40) critical += 1
        else if (rate > 25) high += 1
      }
    }

    // Early delinquency large loans
    for (const l of loans) {
      if (parseFloat(l.principal_amount || 0) > 2_000_000 && (l.par_days || 0) > 0 && (l.par_days || 0) < 90) {
        high += 1
      }
    }

    const total = critical + high + medium
    return NextResponse.json({
      total, critical, high, medium,
      active: total, uninvestigated: total,
    })
  } catch (e) {
    return NextResponse.json({ total: 0, critical: 0, high: 0, medium: 0, active: 0, uninvestigated: 0 })
  }
}
