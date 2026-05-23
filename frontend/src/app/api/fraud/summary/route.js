import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const signals = await supabaseQuery('fraud_signals', { select: 'severity,status,is_resolved' })
    const active = signals.filter(s => !s.is_resolved && s.status !== 'dismissed')
    return NextResponse.json({
      total: signals.length, active: active.length,
      critical: active.filter(s => s.severity === 'critical').length,
      high: active.filter(s => s.severity === 'high').length,
      medium: active.filter(s => s.severity === 'medium').length,
    })
  } catch (e) {
    // fraud_signals table may not exist
    return NextResponse.json({ total: 0, active: 0, critical: 0, high: 0, medium: 0 })
  }
}
