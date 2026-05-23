import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const [loans, clients] = await Promise.all([
      supabaseQuery('loans', { select: 'par_days,status,branch_id,sector,outstanding_balance,client_id' }),
      supabaseQuery('clients', { select: 'id,risk_category' }),
    ])

    const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))
    let critical = 0, high = 0, medium = 0

    // PAR>90 branches → critical
    const par90Branches = new Set(loans.filter(l => (l.par_days || 0) > 90).map(l => l.branch_id).filter(Boolean))
    critical += par90Branches.size

    // NPL loans → critical
    const nplLoans = loans.filter(l => ['npl', 'written_off'].includes(l.status))
    if (nplLoans.length > 0) critical += 1

    // Agriculture PAR
    const agriLoans = loans.filter(l => (l.sector || '').toLowerCase() === 'agriculture')
    const agriParRate = agriLoans.length ? agriLoans.filter(l => (l.par_days || 0) > 30).length / agriLoans.length * 100 : 0
    if (agriParRate > 15) critical += 1
    else if (agriParRate > 8) high += 1

    // PAR 30-90 branches → high
    const par3090Branches = {}
    for (const l of loans) {
      const pd = l.par_days || 0
      if (pd > 30 && pd <= 90 && l.branch_id) {
        par3090Branches[l.branch_id] = (par3090Branches[l.branch_id] || 0) + 1
      }
    }
    high += Object.values(par3090Branches).filter(c => c >= 3).length

    // Critical risk clients → high
    const criticalClients = clients.filter(c => c.risk_category === 'critical')
    if (criticalClients.length > 0) high += 1

    // High-risk clients per branch → medium
    const highRiskByBranch = {}
    for (const l of loans) {
      if (l.status === 'active' && l.client_id) {
        const c = clientMap[l.client_id]
        if (c && ['high', 'critical'].includes(c.risk_category)) {
          highRiskByBranch[l.branch_id || 'x'] = (highRiskByBranch[l.branch_id || 'x'] || 0) + 1
        }
      }
    }
    medium += Object.values(highRiskByBranch).filter(c => c >= 5).length

    return NextResponse.json({
      critical, high, medium,
      unresolved: critical + high + medium,
      total: critical + high + medium,
    })
  } catch (e) {
    return NextResponse.json({ critical: 0, high: 0, medium: 0, unresolved: 0, total: 0 })
  }
}
