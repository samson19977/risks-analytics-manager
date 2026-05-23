import { NextResponse } from 'next/server'

export async function GET() {
  // Scan just re-fetches signals summary
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  try {
    const res = await fetch(`${base}/api/fraud/summary`)
    const summary = await res.json()
    return NextResponse.json({
      scan_date: new Date().toISOString(),
      total_signals: summary.total,
      critical: summary.critical,
      high: summary.high,
      medium: summary.medium,
      status: 'completed',
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
