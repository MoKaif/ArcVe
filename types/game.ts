export type GameStatus = 'Backlog' | 'Active' | 'Finished' | 'Abandoned'

export interface Game {
  id: string
  title: string
  coverImage: string
  status: GameStatus
  platforms: string[]
  lastEngaged?: string
  // Metadata, carried on the list payload so a card can tell what is missing.
  releaseYear?: number
  genres?: string[]
  description?: string
  notes?: string
  userRating?: number
  playthroughUrl?: string
  // Steam-derived. Absent on console, emulated and other non-Steam titles, which
  // is exactly when the manual fields matter.
  steamAppid?: number
  playtimeMinutes?: number
  manualPlaytimeMinutes?: number
  achievementPct?: number
}

/** Metadata fields worth prompting for when empty. */
export const REQUIRED_METADATA = ['coverImage', 'releaseYear', 'platforms', 'genres', 'description'] as const

export function missingMetadata(game: Game): string[] {
  const missing: string[] = []
  if (!game.coverImage || game.coverImage === '/logo.png') missing.push('Cover')
  if (!game.releaseYear) missing.push('Release year')
  if (!game.platforms?.length) missing.push('Platforms')
  if (!game.genres?.length) missing.push('Genres')
  if (!game.description) missing.push('Description')
  // Steam supplies playtime automatically; only ask for it when it cannot.
  if (!game.steamAppid && !game.manualPlaytimeMinutes) missing.push('Playtime')
  return missing
}

export interface GameDetail extends Game {
  developer?: string
  publisher?: string
  coverArtwork?: string
  timeline?: TimelineEntry[]
  videos?: GameVideo[]
  achievementsUnlocked?: number
  achievementsTotal?: number
  /** False when the game is only an IGDB lookup and has no local row to edit. */
  inLibrary?: boolean
}

export interface TimelineEntry {
  id: string
  type: 'added' | 'played' | 'recorded' | 'status_change'
  date: string
  description: string
  icon?: string
}

export interface GameVideo {
  id: string
  title: string
  videoId: string // YouTube video ID
  thumbnail: string
}
