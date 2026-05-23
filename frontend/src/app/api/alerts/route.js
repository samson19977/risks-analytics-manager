import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

// Generate alerts dynamically from loans + clients data
async function generateAlerts() {
  const [loans, clients, branches] = await Promise.all([
    supabaseQuery('loans', { select: 'id,client_id,branch_id,outstanding_balance,par_days,status,sector,loan_number,principal_amount' }),
    supabaseQuery('clients', { select: 'id,full_name,risk_category,risk_score,branch_id,client_code' }),
    supabaseQuery('branches', { select: 'id,name,province' }),
  ])

  const branchMap = Object.fromEntries(branches.map(b => [b.id, b]))
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))
  const alerts = []
  let idCounter = 1

  const makeId = () => `generated-${idCounter++}`
  const now = new Date().toISOString()

  // 1. High PAR loans (par_days > 90) → critical alert per branch
  const byBranch = {}
  for (const l of loans) {
    if ((l.par_days || 0) > 90) {
      const bid = l.branch_id || 'unknown'
      if (!byBranch[bid]) byBranch[bid] = { count: 0, amount: 0 }
      byBranch[bid].count += 1
      byBranch[bid].amount += parseFloat(l.outstanding_balance || 0)
    }
  }
  for (const [bid, data] of Object.entries(byBranch)) {
    const b = branchMap[bid]
    alerts.push({
      id: makeId(), severity: 'critical', alert_type: 'par_90_concentration',
      message: `${data.count} loans over 90 days past due (${(data.amount / 1_000_000).toFixed(1)}M RWF at risk)`,
      branches: b ? { name: b.name } : null,
      branch_id: bid, is_resolved: false, created_at: now,
    })
  }

  // 2. PAR 30-90 per branch → high alert
  const par3090ByBranch = {}
  for (const l of loans) {
    const pd = l.par_days || 0
    if (pd > 30 && pd <= 90) {
      const bid = l.branch_id || 'unknown'
      if (!par3090ByBranch[bid]) par3090ByBranch[bid] = { count: 0, amount: 0 }
      par3090ByBranch[bid].count += 1
      par3090ByBranch[bid].amount += parseFloat(l.outstanding_balance || 0)
    }
  }
  for (const [bid, data] of Object.entries(par3090ByBranch)) {
    if (data.count >= 3) {
      const b = branchMap[bid]
      alerts.push({
        id: makeId(), severity: 'high', alert_type: 'par_30_spike',
        message: `${data.count} loans between 30-90 days overdue at ${b?.name || 'branch'} — early collection action needed`,
        branches: b ? { name: b.name } : null,
        branch_id: bid, is_resolved: false, created_at: now,
      })
    }
  }

  // 3. NPL clients → critical
  const nplLoans = loans.filter(l => ['npl', 'written_off'].includes(l.status))
  if (nplLoans.length > 0) {
    const nplAmount = nplLoans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    alerts.push({
      id: makeId(), severity: 'critical', alert_type: 'npl_threshold_breach',
      message: `${nplLoans.length} non-performing loans totalling ${(nplAmount / 1_000_000).toFixed(1)}M RWF require immediate write-off review`,
      branches: null, branch_id: null, is_resolved: false, created_at: now,
    })
  }

  // 4. Critical risk clients → high alert
  const criticalClients = clients.filter(c => c.risk_category === 'critical')
  if (criticalClients.length > 0) {
    alerts.push({
      id: makeId(), severity: 'high', alert_type: 'critical_risk_clients',
      message: `${criticalClients.length} clients flagged as critical risk — immediate relationship manager review required`,
      branches: null, branch_id: null, is_resolved: false, created_at: now,
    })
  }

  // 5. Sector concentration — agriculture sector PAR
  const agriLoans = loans.filter(l => (l.sector || '').toLowerCase() === 'agriculture')
  const agriPar = agriLoans.filter(l => (l.par_days || 0) > 30)
  if (agriLoans.length > 0) {
    const agriParRate = agriPar.length / agriLoans.length * 100
    if (agriParRate > 15) {
      alerts.push({
        id: makeId(), severity: 'critical', alert_type: 'sector_concentration_risk',
        message: `Agriculture sector PAR>30 at ${agriParRate.toFixed(1)}% — sector exposure review required`,
        branches: null, branch_id: null, is_resolved: false, created_at: now,
      })
    } else if (agriParRate > 8) {
      alerts.push({
        id: makeId(), severity: 'high', alert_type: 'sector_concentration_risk',
        message: `Agriculture sector PAR>30 rising to ${agriParRate.toFixed(1)}% — monitor closely`,
        branches: null, branch_id: null, is_resolved: false, created_at: now,
      })
    }
  }

  // 6. High-risk clients with active loans → medium alert per branch
  const highRiskWithLoans = {}
  for (const l of loans) {
    if (l.status === 'active' && l.client_id) {
      const c = clientMap[l.client_id]
      if (c && ['high', 'critical'].includes(c.risk_category)) {
        const bid = l.branch_id || 'unknown'
        if (!highRiskWithLoans[bid]) highRiskWithLoans[bid] = 0
        highRiskWithLoans[bid] += 1
      }
    }
  }
  for (const [bid, count] of Object.entries(highRiskWithLoans)) {
    if (count >= 5) {
      const b = branchMap[bid]
      alerts.push({
        id: makeId(), severity: 'medium', alert_type: 'high_risk_client_concentration',
        message: `${count} high/critical risk clients with active loans at ${b?.name || 'branch'} — enhanced monitoring needed`,
        branches: b ? { name: b.name } : null,
        branch_id: bid, is_resolved: false, created_at: now,
      })
    }
  }

  return alerts
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const isResolved = searchParams.get('is_resolved') === 'true'

    let alerts = await generateAlerts()

    // Filter resolved (generated alerts are never resolved unless toggled)
    alerts = alerts.filter(a => a.is_resolved === isResolved)
    if (severity) alerts = alerts.filter(a => a.severity === severity)

    // Sort: critical first
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    alerts.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9))

    return NextResponse.json(alerts)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
