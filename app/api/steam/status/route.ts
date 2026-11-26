import { NextResponse } from 'next/server'

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/steam/status`, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ playing: null }, { status: 200 })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('[steam] status failed:', error)
    return NextResponse.json({ playing: null }, { status: 200 })
  }
}
