import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const clients = await supabaseQuery('clients', {
      select: '*,branches(name)',
      filters: [['risk_category', 'in', ['high', 'critical']]],
      order: 'risk_score.desc',
      limit: 20,
    })
    return NextResponse.json(clients)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
