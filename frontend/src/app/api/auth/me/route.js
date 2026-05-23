import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '')

    if (!token || !token.startsWith('demo.')) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const payload = JSON.parse(Buffer.from(token.replace('demo.', ''), 'base64').toString())

    if (payload.exp < Date.now()) {
      return NextResponse.json({ detail: 'Token expired' }, { status: 401 })
    }

    return NextResponse.json({
      id: payload.sub,
      email: payload.email,
      full_name: payload.name,
      role: payload.role,
    })
  } catch {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }
}
