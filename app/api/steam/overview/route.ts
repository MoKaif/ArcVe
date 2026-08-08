import { NextResponse } from 'next/server'

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/steam/overview`, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to load Steam overview' }, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('[steam] overview failed:', error)
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 })
  }
}
