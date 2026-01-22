/**
 * IGDB API Service
 * 
 * This service handles all interactions with the IGDB (Internet Game Database) API.
 * You'll need to set up environment variables:
 * - IGDB_CLIENT_ID: Your IGDB client ID
 * - IGDB_CLIENT_SECRET: Your IGDB client secret
 * 
 * Documentation: https://api-docs.igdb.com/
 */

interface IGDBAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

let cachedToken: string | null = null
let tokenExpiry: number = 0

/**
 * Get an access token for IGDB API
 */
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

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    throw new Error('Failed to authenticate with IGDB')
  }

  const data: IGDBAuthResponse = await response.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + data.expires_in * 1000

  return cachedToken
}

/**
 * Make a request to IGDB API
 */
async function igdbRequest(endpoint: string, body: string): Promise<any> {
  const token = await getAccessToken()
  const clientId = process.env.IGDB_CLIENT_ID

  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`IGDB API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Search for games by name
 */
export async function searchGames(query: string, limit = 10) {
  const body = `
    search "${query}";
    fields name, cover.url, first_release_date, platforms.name, summary;
    limit ${limit};
  `
  return igdbRequest('games', body)
}

/**
 * Get game details by ID
 */
export async function getGameById(id: number) {
  const body = `
    fields name, cover.url, first_release_date, platforms.name, 
           summary, storyline, screenshots.url, videos.video_id,
           genres.name, themes.name, game_modes.name, player_perspectives.name,
           involved_companies.company.name, involved_companies.developer,
           involved_companies.publisher, rating, rating_count, aggregated_rating;
    where id = ${id};
  `
  const results = await igdbRequest('games', body)
  return results[0]
}

/**
 * Get multiple games by IDs
 */
export async function getGamesByIds(ids: number[]) {
  const body = `
    fields name, cover.url, first_release_date, platforms.name, summary;
    where id = (${ids.join(',')});
    limit ${ids.length};
  `
  return igdbRequest('games', body)
}

/**
 * Get popular games
 */
export async function getPopularGames(limit = 20) {
  const body = `
    fields name, cover.url, first_release_date, platforms.name, summary, rating;
    where rating_count > 100 & rating > 80;
    sort rating desc;
    limit ${limit};
  `
  return igdbRequest('games', body)
}

/**
 * Get recently released games
 */
export async function getRecentGames(limit = 20) {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
  const body = `
    fields name, cover.url, first_release_date, platforms.name, summary;
    where first_release_date > ${thirtyDaysAgo};
    sort first_release_date desc;
    limit ${limit};
  `
  return igdbRequest('games', body)
}

/**
 * Transform IGDB cover URL to desired size
 * Sizes: cover_small, screenshot_med, cover_big, 720p, 1080p
 */
export function transformImageUrl(url: string, size: string = 'cover_big'): string {
  if (!url) return ''
  return url.replace('t_thumb', `t_${size}`)
}
