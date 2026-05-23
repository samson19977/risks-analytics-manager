import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, clients, branches] = await Promise.all([
      supabaseQuery('loans', { select: 'id,loan_number,client_id,branch_id,disbursement_date,principal_amount,par_days,status,outstanding_balance,loan_officer' }),
      supabaseQuery('clients', { select: 'id,full_name,client_code,branch_id,national_id' }),
      supabaseQuery('branches', { select: 'id,name' }),
    ])

    const branchMap = Object.fromEntries(branches.map(b => [b.id, b.name]))
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))
    const signals = []
    let idCounter = 1
    const now = new Date().toISOString()

    // 1. Multiple active loans per client
    const clientActiveLoans = {}
    for (const l of loans) {
      if (l.client_id && l.status === 'active') {
        if (!clientActiveLoans[l.client_id]) clientActiveLoans[l.client_id] = []
        clientActiveLoans[l.client_id].push(l)
      }
    }
    for (const [cid, cLoans] of Object.entries(clientActiveLoans)) {
      if (cLoans.length >= 2) {
        const c = clientMap[cid]
        const bid = cLoans[0].branch_id
        const totalExposure = cLoans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
        signals.push({
          id: `fraud-${idCounter++}`, signal_type: 'multiple_active_loans',
          severity: cLoans.length >= 3 ? 'critical' : 'high',
          description: `${c?.full_name || 'Client'} (${c?.client_code || cid}) has ${cLoans.length} simultaneous active loans — total exposure: ${(totalExposure / 1000).toFixed(0)}K RWF`,
          branch_name: branchMap[bid] || 'Unknown', branch_id: bid,
          is_investigated: false, created_at: now,
          details: { client_id: cid, loan_count: cLoans.length, total_exposure: totalExposure },
        })
      }
    }

    // 2. Month-end disbursement spikes (≥3 loans from same branch on same day near month-end)
    const byDayBranch = {}
    for (const l of loans) {
      if (!l.disbursement_date || !l.branch_id) continue
      const d = new Date(l.disbursement_date)
      if (d.getDate() >= 26) {
        const key = `${l.disbursement_date}__${l.branch_id}`
        if (!byDayBranch[key]) byDayBranch[key] = []
        byDayBranch[key].push(l)
      }
    }
    for (const [key, dayLoans] of Object.entries(byDayBranch)) {
      if (dayLoans.length >= 3) {
        const [date, bid] = key.split('__')
        const totalAmt = dayLoans.reduce((s, l) => s + parseFloat(l.principal_amount || 0), 0)
        signals.push({
          id: `fraud-${idCounter++}`, signal_type: 'month_end_disbursement_spike',
          severity: dayLoans.length >= 5 ? 'critical' : 'high',
          description: `${dayLoans.length} loans disbursed on ${date} (month-end) at ${branchMap[bid] || 'Unknown'} — total: ${(totalAmt / 1_000_000).toFixed(1)}M RWF`,
          branch_name: branchMap[bid] || 'Unknown', branch_id: bid,
          is_investigated: false, created_at: now,
          details: { date, count: dayLoans.length, total_amount: totalAmt },
        })
      }
    }

    // 3. Same loan officer with unusually high PAR rate
    const officerStats = {}
    for (const l of loans) {
      const lo = l.loan_officer || 'Unknown'
      if (!officerStats[lo]) officerStats[lo] = { total: 0, par: 0, branch_id: l.branch_id }
      officerStats[lo].total += 1
      if ((l.par_days || 0) > 30) officerStats[lo].par += 1
    }
    for (const [lo, stats] of Object.entries(officerStats)) {
      if (stats.total >= 5) {
        const parRate = stats.par / stats.total * 100
        if (parRate > 25) {
          signals.push({
            id: `fraud-${idCounter++}`, signal_type: 'officer_high_par_rate',
            severity: parRate > 40 ? 'critical' : 'high',
            description: `Loan officer "${lo}" has ${parRate.toFixed(0)}% PAR>30 rate across ${stats.total} loans — possible credit quality issues`,
            branch_name: branchMap[stats.branch_id] || 'Unknown', branch_id: stats.branch_id,
            is_investigated: false, created_at: now,
            details: { officer: lo, par_rate: parRate, total_loans: stats.total },
          })
        }
      }
    }

    // 4. Large loans with immediate PAR (par_days > 0 within first 90 days of disbursement)
    for (const l of loans) {
      const principal = parseFloat(l.principal_amount || 0)
      if (principal > 2_000_000 && (l.par_days || 0) > 0 && (l.par_days || 0) < 90) {
        const c = clientMap[l.client_id]
        signals.push({
          id: `fraud-${idCounter++}`, signal_type: 'early_delinquency_large_loan',
          severity: 'high',
          description: `Large loan ${l.loan_number || l.id} (${(principal / 1_000_000).toFixed(1)}M RWF) to ${c?.full_name || 'client'} went delinquent within 90 days`,
          branch_name: branchMap[l.branch_id] || 'Unknown', branch_id: l.branch_id,
          is_investigated: false, created_at: now,
          details: { loan_id: l.id, principal, par_days: l.par_days },
        })
      }
    }

    // Sort: critical first, then high
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    signals.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9))

    return NextResponse.json(signals)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
