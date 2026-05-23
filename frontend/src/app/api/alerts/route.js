import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const isResolved = searchParams.get('is_resolved') === 'true'

    const filters = [['is_resolved', 'eq', isResolved]]
    if (severity) filters.push(['severity', 'eq', severity])

    const alerts = await supabaseQuery('risk_alerts', {
      select: '*,branches(name)',
      filters,
      order: 'created_at.desc',
      limit: 50,
    })
    return NextResponse.json(alerts)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
