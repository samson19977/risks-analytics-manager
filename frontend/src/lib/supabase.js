const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

export async function supabaseQuery(table, { select = '*', filters = [], order = null, limit = null, range = null } = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  url.searchParams.set('select', select)
  if (order) url.searchParams.set('order', order)
  if (limit) url.searchParams.set('limit', limit)

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  // Apply range header for pagination
  if (range) headers['Range'] = `${range[0]}-${range[1]}`

  // Build filter params
  for (const [col, op, val] of filters) {
    if (op === 'eq') url.searchParams.set(col, `eq.${val}`)
    else if (op === 'in') url.searchParams.set(col, `in.(${val.join(',')})`)
    else if (op === 'is') url.searchParams.set(col, `is.${val}`)
    else if (op === 'ilike') url.searchParams.set(col, `ilike.${val}`)
    else if (op === 'neq') url.searchParams.set(col, `neq.${val}`)
  }

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function supabaseUpdate(table, id, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Supabase error ${res.status}`)
  return res.json()
}
