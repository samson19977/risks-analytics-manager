import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const [clientData, loans, payments] = await Promise.all([
      supabaseQuery('clients', { select: '*,branches(name,province)', filters: [['id', 'eq', id]] }),
      supabaseQuery('loans', { select: '*', filters: [['client_id', 'eq', id]] }),
      supabaseQuery('payments', { select: '*', filters: [['client_id', 'eq', id]], order: 'payment_date.desc', limit: 20 }),
    ])
    return NextResponse.json({ client: clientData[0] || null, loans, payments })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
