import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    const token = await getAccessToken()
    const clientId = process.env.IGDB_CLIENT_ID

    console.log('[v0] Fetching popular games from IGDB...')

    // Fetch popular games with their covers
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        fields name, cover.image_id, cover.url, platforms.name, first_release_date, rating;
        where rating_count > 50 & cover != null & platforms != null;
        sort rating desc;
        limit 20;
      `,
    })

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.statusText}`)
    }

    const games = await response.json()
    
    console.log(`[v0] Fetched ${games.length} games from IGDB`)

    // Transform the data to match our Game interface
    const transformedGames = games.map((game: any, index: number) => {
      const coverUrl = game.cover?.image_id 
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : '/placeholder.svg'
      
      const platforms = game.platforms?.slice(0, 3).map((p: any) => p.name) || ['PC']
      
      // Assign random status for demo
      const statuses = ['Backlog', 'Active', 'Finished', 'Abandoned']
      const status = statuses[index % 4]
      
      return {
        id: game.id.toString(),
        title: game.name,
        coverImage: coverUrl,
        status,
        platforms,
        lastEngaged: index % 3 === 0 ? '2 days ago' : index % 3 === 1 ? '1 week ago' : undefined,
      }
    })

    return NextResponse.json(transformedGames)
  } catch (error) {
    console.error('[v0] Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games from IGDB' },
      { status: 500 }
    )
  }
}
