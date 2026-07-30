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

const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000'

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
      fetch(`${INTERNAL_BACKEND_URL}/games/${gameId}`).then(res => res.ok ? res.json() : null).catch(err => {
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

    // Timeline built from data we actually hold. An earlier version invented
    // these entries, including a fabricated "recorded 3.5 hours" session.
    const timeline: TimelineEntry[] = []
    if (localGameResponse?.last_played_at) {
      timeline.push({
        id: 'last-played',
        type: 'played',
        date: new Date(localGameResponse.last_played_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        description: 'Last played on Steam',
      })
    }
    if (localGameResponse?.playthrough_video_url) {
      timeline.push({
        id: 'recorded',
        type: 'recorded',
        date: '',
        description: 'Playthrough recorded',
      })
    }
    if (localGameResponse?.status) {
      timeline.push({
        id: 'status',
        type: 'status_change',
        date: '',
        description: `Marked as ${localGameResponse.status}`,
      })
    }

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

      // IGDB is the richer source, but anything you filled in by hand wins when
      // IGDB has nothing — that is the whole point of the manual metadata editor.
      platforms:
        game.platforms?.map((p: { name: string }) => p.name).slice(0, 5) ||
        localGameResponse?.platforms?.split(',').filter(Boolean) ||
        [],
      releaseYear:
        (game.first_release_date
          ? new Date(game.first_release_date * 1000).getFullYear()
          : undefined) ?? localGameResponse?.release_year ?? undefined,
      genres:
        game.genres?.map((g: { name: string }) => g.name) ||
        localGameResponse?.genres?.split(',').filter(Boolean) ||
        [],
      description: game.summary || localGameResponse?.description || '',
      developer,
      publisher,
      lastEngaged: localGameResponse?.last_engaged ?? undefined,
      timeline,
      videos,
      playthroughUrl: localGameResponse?.playthrough_video_url,
      status: localGameResponse?.status || 'Backlog',
      notes: localGameResponse?.notes ?? undefined,
      userRating: localGameResponse?.user_rating ?? undefined,
      steamAppid: localGameResponse?.steam_appid ?? undefined,
      playtimeMinutes: localGameResponse?.playtime_minutes ?? undefined,
      manualPlaytimeMinutes: localGameResponse?.manual_playtime_minutes ?? undefined,
      achievementPct: localGameResponse?.achievement_pct ?? undefined,
      achievementsUnlocked: localGameResponse?.achievements_unlocked ?? undefined,
      achievementsTotal: localGameResponse?.achievements_total ?? undefined,
      inLibrary: Boolean(localGameResponse),
    }

    console.log('[v0] Game detail fetched successfully:', gameDetail.title)
    return NextResponse.json(gameDetail)
  } catch (error) {
    console.error('[v0] Error fetching game detail:', error)
    return NextResponse.json({ error: 'Failed to fetch game details' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()

    const response = await fetch(`${INTERNAL_BACKEND_URL}/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = await response.json().catch(() => null)
      return NextResponse.json(
        { error: detail?.detail || 'Failed to update game' },
        { status: response.status }
      )
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('[v0] Error updating game:', error)
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    console.log('[v0] Proxying DELETE to backend for ID:', gameId)

    const response = await fetch(`${INTERNAL_BACKEND_URL}/games/${gameId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete from backend')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] Error deleting game:', error)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}
