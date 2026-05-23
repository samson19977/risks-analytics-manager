import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { context = 'portfolio_review' } = body

    // Fetch live portfolio data to give Claude real numbers
    const [loans, clients, alerts, branches] = await Promise.all([
      supabaseQuery('loans', { select: 'outstanding_balance,par_days,status,sector,branch_id,principal_amount' }),
      supabaseQuery('clients', { select: 'risk_category,is_active' }),
      supabaseQuery('risk_alerts', { select: 'severity,is_resolved,alert_type', filters: [['is_resolved', 'eq', false]] }),
      supabaseQuery('branches', { select: 'id,name,province' }),
    ])

    const n = loans.length || 1
    const total = loans.reduce((s, l) => s + parseFloat(l.outstanding_balance || 0), 0)
    const par30Pct = (loans.filter(l => (l.par_days || 0) > 30).length / n * 100).toFixed(1)
    const nplPct = (loans.filter(l => ['npl', 'written_off'].includes(l.status)).length / n * 100).toFixed(1)
    const riskDist = {}
    for (const c of clients) { const k = c.risk_category || 'medium'; riskDist[k] = (riskDist[k] || 0) + 1 }
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

    const portfolioSummary = {
      total_loans: n,
      gross_portfolio_rwf: Math.round(total),
      par30_pct: par30Pct,
      npl_pct: nplPct,
      active_clients: clients.filter(c => c.is_active !== false).length,
      branches: branches.length,
      unresolved_critical_alerts: criticalAlerts,
      risk_distribution: riskDist,
    }

    const contextPrompts = {
      portfolio_review: `You are a senior microfinance risk analyst for AB Rwanda, a microfinance institution. Analyse this portfolio data and provide a professional executive summary with key findings, risk concerns, and 3-5 actionable recommendations. Be specific with numbers.`,
      early_warning: `You are a microfinance risk specialist. Review this portfolio data and identify early warning signals that could lead to portfolio deterioration in the next 30-90 days. List specific risks and preventive actions.`,
      branch_risk: `You are a microfinance branch performance analyst. Based on this portfolio data, assess branch network risk concentration and recommend which branches need immediate management attention and why.`,
      client_risk: `You are a credit risk officer at a microfinance institution. Analyse the client risk distribution data and recommend targeted interventions for high-risk client segments to prevent defaults.`,
    }

    const systemPrompt = contextPrompts[context] || contextPrompts.portfolio_review
    const userMessage = `Portfolio Data (as of today):\n${JSON.stringify(portfolioSummary, null, 2)}\n\nPlease provide your analysis.`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'skip') {
      // Return a rule-based analysis if no API key
      const recommendation = generateRuleBasedAnalysis(portfolioSummary, context)
      return NextResponse.json({ recommendation })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const data = await res.json()
    const recommendation = data.content?.[0]?.text || 'No response received.'
    return NextResponse.json({ recommendation })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function generateRuleBasedAnalysis(data, context) {
  const par = parseFloat(data.par30_pct)
  const npl = parseFloat(data.npl_pct)
  const critical = data.unresolved_critical_alerts

  const lines = []
  lines.push(`📊 PORTFOLIO ANALYSIS — ${new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' })}`)
  lines.push('')
  lines.push(`Portfolio Size: ${(data.gross_portfolio_rwf / 1_000_000).toFixed(1)}M RWF across ${data.total_loans} loans and ${data.active_clients} active clients in ${data.branches} branches.`)
  lines.push('')

  if (par > 15) {
    lines.push(`🔴 HIGH RISK: PAR>30 is at ${par}%, significantly above the 10% industry threshold. Immediate intervention required.`)
  } else if (par > 10) {
    lines.push(`🟠 ELEVATED RISK: PAR>30 at ${par}% exceeds the 10% threshold. Proactive collection actions needed.`)
  } else {
    lines.push(`🟢 PAR>30 at ${par}% is within acceptable range. Maintain current monitoring intensity.`)
  }

  lines.push('')
  if (npl > 5) {
    lines.push(`🔴 NPL ratio of ${npl}% requires immediate provisioning review and write-off policy assessment.`)
  } else {
    lines.push(`✅ NPL ratio of ${npl}% is within manageable range.`)
  }

  lines.push('')
  if (critical > 0) {
    lines.push(`⚠️ ${critical} critical unresolved alert(s) require immediate management attention.`)
  }

  const riskDist = data.risk_distribution || {}
  const totalClients = Object.values(riskDist).reduce((a, b) => a + b, 0) || 1
  const criticalPct = ((riskDist.critical || 0) / totalClients * 100).toFixed(1)
  const highPct = ((riskDist.high || 0) / totalClients * 100).toFixed(1)
  lines.push('')
  lines.push(`Client Risk: ${criticalPct}% critical, ${highPct}% high risk. ${parseFloat(criticalPct) > 10 ? 'Concentration of high-risk clients is concerning.' : 'Risk distribution is manageable.'}`)

  lines.push('')
  lines.push('RECOMMENDED ACTIONS:')
  lines.push('1. Conduct weekly PAR review meetings with branch managers')
  if (par > 10) lines.push('2. Deploy field teams for door-to-door collection on PAR>30 accounts')
  lines.push('3. Freeze new disbursements to clients with existing PAR loans')
  if (critical > 0) lines.push('4. Resolve critical alerts within 48 hours — escalate to senior management')
  lines.push('5. Review and tighten credit scoring criteria for new loan applications')

  return lines.join('\n')
}
