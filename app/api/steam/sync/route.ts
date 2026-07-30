import { NextRequest, NextResponse } from 'next/server'

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

// A full library sync hits IGDB in batches and can outrun the default timeout.
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const withAchievements = request.nextUrl.searchParams.get('achievements') === '1'

  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/steam/sync`, { method: 'POST' })
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Sync failed' }, { status: response.status })
    }

    if (withAchievements) {
      const achievements = await fetch(
        `${INTERNAL_BACKEND_URL}/steam/sync/achievements`,
        { method: 'POST' }
      )
      data.achievements = achievements.ok ? await achievements.json() : null
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[steam] sync failed:', error)
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 })
  }
}
