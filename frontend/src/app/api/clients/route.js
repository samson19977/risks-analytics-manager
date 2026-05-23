import { NextResponse } from 'next/server'
import { supabaseQuery } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const riskCategory = searchParams.get('risk_category')
    const branchId = searchParams.get('branch_id')
    const search = searchParams.get('search')

    const filters = []
    if (riskCategory) filters.push(['risk_category', 'eq', riskCategory])
    if (branchId) filters.push(['branch_id', 'eq', branchId])
    if (search) filters.push(['full_name', 'ilike', `%${search}%`])

    const offset = (page - 1) * limit
    const clients = await supabaseQuery('clients', {
      select: '*,branches(name,province)',
      filters,
      range: [offset, offset + limit - 1],
    })
    return NextResponse.json(clients)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
