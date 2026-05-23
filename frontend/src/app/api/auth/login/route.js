import { NextResponse } from 'next/server'

const DEMO_USERS = [
  { id: 'demo-admin-001',   email: 'admin@abrwanda.rw',    full_name: 'Admin User',        role: 'admin' },
  { id: 'demo-admin-002',   email: 'admin@abrwanda.com',   full_name: 'Admin User',        role: 'admin' },
  { id: 'demo-risk-001',    email: 'risk@abrwanda.com',    full_name: 'Risk Manager',      role: 'risk_manager' },
  { id: 'demo-analyst-001', email: 'analyst@abrwanda.com', full_name: 'Portfolio Analyst', role: 'analyst' },
  { id: 'demo-branch-001',  email: 'branch@abrwanda.com',  full_name: 'Branch Manager',    role: 'branch_manager' },
  { id: 'demo-viewer-001',  email: 'viewer@abrwanda.com',  full_name: 'Executive Viewer',  role: 'viewer' },
]

function makeToken(user) {
  const payload = { sub: user.id, email: user.email, role: user.role, name: user.full_name, exp: Date.now() + 86400000 }
  return 'demo.' + Buffer.from(JSON.stringify(payload)).toString('base64')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ detail: 'Email is required.' }, { status: 400 })
    }

    const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase())

    if (!user) {
      return NextResponse.json({ detail: 'User not found.' }, { status: 401 })
    }

    return NextResponse.json({
      access_token: makeToken(user),
      token_type: 'bearer',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    })
  } catch {
    return NextResponse.json({ detail: 'Server error.' }, { status: 500 })
  }
}
