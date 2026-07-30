import { NextResponse } from 'next/server'

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/steam/unmatched`, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json([], { status: 200 })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('[steam] unmatched failed:', error)
    return NextResponse.json([], { status: 200 })
  }
}
