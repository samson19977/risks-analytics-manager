import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const alerts = await supabaseQuery('risk_alerts', { select: 'severity,is_resolved' })
    const unresolved = alerts.filter(a => !a.is_resolved)
    return NextResponse.json({
      critical: unresolved.filter(a => a.severity === 'critical').length,
      high: unresolved.filter(a => a.severity === 'high').length,
      medium: unresolved.filter(a => a.severity === 'medium').length,
      unresolved: unresolved.length,
      total: alerts.length,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
