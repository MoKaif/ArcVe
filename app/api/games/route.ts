import { NextRequest, NextResponse } from 'next/server'

interface IGDBAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials not configured')
  }

  console.log('[v0] Authenticating with IGDB...')

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    throw new Error('Failed to authenticate with IGDB')
  }

  const data: IGDBAuthResponse = await response.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Expire 1 min early

  console.log('[v0] IGDB authentication successful')

  return cachedToken
}

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    // If query is present, search IGDB (for adding new games)
    if (query) {
      return searchIGDB(query)
    }

    // Otherwise, fetch from local backend (Library view)
    console.log('[v0] Fetching games from local backend...')
    const response = await fetch(`${INTERNAL_BACKEND_URL}/games`)

    if (!response.ok) {
      throw new Error('Failed to fetch from backend')
    }

    const games = await response.json()

    // Transform backend data to frontend Game interface. The metadata fields come
    // through so a card can show what is missing and offer to fill it in.
    const transformedGames = games.map((game: any) => ({
      id: game.igdb_id.toString(),
      title: game.title,
      coverImage: game.cover_image || '/logo.png',
      status: game.status,
      platforms: game.platforms ? game.platforms.split(',').filter(Boolean) : [],
      lastEngaged: game.last_engaged,
      releaseYear: game.release_year ?? undefined,
      genres: game.genres ? game.genres.split(',').filter(Boolean) : [],
      description: game.description ?? undefined,
      notes: game.notes ?? undefined,
      userRating: game.user_rating ?? undefined,
      playthroughUrl: game.playthrough_video_url ?? undefined,
      steamAppid: game.steam_appid ?? undefined,
      playtimeMinutes: game.playtime_minutes ?? undefined,
      manualPlaytimeMinutes: game.manual_playtime_minutes ?? undefined,
      achievementPct: game.achievement_pct ?? undefined,
    }))

    return NextResponse.json(transformedGames)
  } catch (error) {
    console.error('[v0] Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[v0] Proxying POST to backend...')

    const response = await fetch(`${INTERNAL_BACKEND_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error('Failed to save to backend')
    }

    const savedGame = await response.json()
    return NextResponse.json(savedGame)
  } catch (error) {
    console.error('[v0] Error saving game:', error)
    return NextResponse.json(
      { error: 'Failed to save game' },
      { status: 500 }
    )
  }
}

async function searchIGDB(query: string) {
  const token = await getAccessToken()
  const clientId = process.env.IGDB_CLIENT_ID

  console.log(`[v0] Searching IGDB for: ${query}`)

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId!,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: `
        fields name, cover.image_id, first_release_date, genres.name, involved_companies.company.name, summary;
        search "${query}";
        limit 10;
      `,
  })

  if (!response.ok) {
    throw new Error(`IGDB API error: ${response.statusText}`)
  }

  const games = await response.json()
  return NextResponse.json(games.map((game: any) => ({
    id: game.id.toString(),
    title: game.name,
    coverImage: game.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
      : '/placeholder.svg',
    releaseYear: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined,
    genres: game.genres?.map((g: any) => g.name) || [],
    description: game.summary
  })))
}
