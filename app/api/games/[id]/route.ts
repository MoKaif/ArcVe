import { NextRequest, NextResponse } from 'next/server'
import type { GameDetail, TimelineEntry, GameVideo } from '@/types/game'

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  console.log('[v0] Authenticating with IGDB...')

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    throw new Error('Failed to authenticate with IGDB')
  }

  const data = await response.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000, // 1 minute buffer
  }

  console.log('[v0] IGDB authentication successful')
  return cachedToken.token
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    console.log('[v0] Fetching game detail for ID:', gameId)

    // Parallel fetch: IGDB token and Local Backend data
    const [accessToken, localGameResponse] = await Promise.all([
      getAccessToken(),
      fetch(`http://localhost:8000/games/${gameId}`).then(res => res.ok ? res.json() : null).catch(err => {
        console.error('Failed to fetch from local backend:', err);
        return null;
      })
    ])

    // Fetch game details with more comprehensive data
    const gameResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `fields name, cover.image_id, genres.name, first_release_date, platforms.name, summary, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, artworks.image_id, videos.video_id, videos.name; where id = ${gameId};`,
    })

    if (!gameResponse.ok) {
      throw new Error('Failed to fetch game from IGDB')
    }

    const games = await gameResponse.json()

    if (!games || games.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const game = games[0]

    // Extract developer and publisher
    let developer = ''
    let publisher = ''
    if (game.involved_companies) {
      for (const ic of game.involved_companies) {
        if (ic.developer && ic.company?.name) {
          developer = ic.company.name
        }
        if (ic.publisher && ic.company?.name) {
          publisher = ic.company.name
        }
      }
    }

    // Generate mock timeline data
    const timeline: TimelineEntry[] = [
      {
        id: '1',
        type: 'added',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        description: `Added ${game.name} to library`,
      },
      {
        id: '2',
        type: 'played',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        description: 'Started playing',
      },
      {
        id: '3',
        type: 'recorded',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        description: 'Recorded gameplay session - 3.5 hours',
      },
    ]

    // Process videos
    const videos: GameVideo[] =
      game.videos?.map((video: { video_id: string; name: string }) => ({
        id: video.video_id,
        title: video.name || 'Gameplay Video',
        videoId: video.video_id,
        thumbnail: `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`,
      })) || []

    const gameDetail: GameDetail = {
      id: game.id.toString(),
      title: game.name,
      coverImage: game.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : '/placeholder.svg',
      coverArtwork: game.artworks?.[0]?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_1080p/${game.artworks[0].image_id}.jpg`
        : game.cover?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`
          : '/placeholder.svg',

      platforms: game.platforms?.map((p: { name: string }) => p.name).slice(0, 5) || [],
      releaseYear: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : undefined,
      genres: game.genres?.map((g: { name: string }) => g.name) || [],
      description: game.summary || '',
      developer,
      publisher,
      lastEngaged: '2 days ago', // TODO: this could also come from backend
      timeline,
      videos,
      playthroughUrl: localGameResponse?.playthrough_video_url,
      status: localGameResponse?.status || 'Backlog',
      // Override title/rating if available from backend? Maybe not for now.
    }

    console.log('[v0] Game detail fetched successfully:', gameDetail.title)
    return NextResponse.json(gameDetail)
  } catch (error) {
    console.error('[v0] Error fetching game detail:', error)
    return NextResponse.json({ error: 'Failed to fetch game details' }, { status: 500 })
  }
}
