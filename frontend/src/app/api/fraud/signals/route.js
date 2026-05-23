import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET() {
  try {
    const signals = await supabaseQuery('fraud_signals', {
      select: '*,branches(name),loans(loan_number)',
      order: 'created_at.desc',
      limit: 50,
    })
    return NextResponse.json(signals)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
