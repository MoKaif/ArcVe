import { NextRequest, NextResponse } from 'next/server'

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get('days') || '30'

  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/steam/history?days=${days}`, {
      cache: 'no-store',
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to load history' }, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('[steam] history failed:', error)
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 })
  }
}
