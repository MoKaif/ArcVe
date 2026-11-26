import { NextResponse } from 'next/server'

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/steam/backlog`, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to load backlog' }, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('[steam] backlog failed:', error)
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 })
  }
}
