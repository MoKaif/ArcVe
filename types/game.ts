export type GameStatus = 'Backlog' | 'Active' | 'Finished' | 'Abandoned'

export interface Game {
  id: string
  title: string
  coverImage: string
  status: GameStatus
  platforms: string[]
  lastEngaged?: string
}

export interface GameDetail extends Game {
  releaseYear?: number
  genres?: string[]
  description?: string
  developer?: string
  publisher?: string
  coverArtwork?: string
  timeline?: TimelineEntry[]
  videos?: GameVideo[]
  playthroughUrl?: string
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
