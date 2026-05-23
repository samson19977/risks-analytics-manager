import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { prompt, context } = body
    // Forward to Anthropic if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'skip') {
      return NextResponse.json({ response: 'AI analysis requires a valid Anthropic API key. Configure ANTHROPIC_API_KEY in your environment.' })
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, messages: [{ role: 'user', content: `${context ? `Context: ${JSON.stringify(context)}\n\n` : ''}${prompt}` }] }),
    })
    const data = await res.json()
    return NextResponse.json({ response: data.content?.[0]?.text || 'No response' })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
