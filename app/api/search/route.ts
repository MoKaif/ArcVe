import { NextRequest, NextResponse } from 'next/server'

let cachedToken: { access_token: string; expires_at: number } | null = null

async function getAccessToken() {
  const now = Date.now()

  if (cachedToken && cachedToken.expires_at > now) {
    return cachedToken.access_token
  }

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing IGDB credentials')
  }

  const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`

  const response = await fetch(url, { method: 'POST' })
  const data = (await response.json()) as { access_token: string; expires_in: number }

  cachedToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000 - 300000, // Refresh 5 min before expiry
  }

  return data.access_token
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const accessToken = await getAccessToken()

    const body = `search "${query}"; fields id,name,cover.url,release_dates.y,genres.name,first_release_date; limit 10;`

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': process.env.IGDB_CLIENT_ID || '',
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    })

    if (!response.ok) {
      console.error('[v0] IGDB API error:', response.status)
      return NextResponse.json({ results: [] })
    }

    const games = (await response.json()) as Array<{
      id: number
      name: string
      cover?: { url: string }
      first_release_date?: number
      genres?: Array<{ name: string }>
    }>

    const results = games.map((game) => ({
      id: game.id.toString(),
      title: game.name,
      coverImage: game.cover?.url
        ? game.cover.url.startsWith('//')
          ? `https:${game.cover.url}`
          : game.cover.url
        : '/placeholder.svg',
      releaseYear: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined,
      genres: game.genres?.map((g) => g.name) || [],
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[v0] Search error:', error)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
