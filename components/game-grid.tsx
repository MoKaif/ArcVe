'use client'

import { GameCard } from './game-card'
import type { Game } from '@/types/game'

interface GameGridProps {
  games: Game[]
  onViewDetails?: (game: Game) => void
  onViewMedia?: (game: Game) => void
  onGameUpdated?: (game: Game) => void
}

export function GameGrid({ games, onViewDetails, onViewMedia, onGameUpdated }: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No games found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onViewDetails={onViewDetails}
          onViewMedia={onViewMedia}
          onGameUpdated={onGameUpdated}
        />
      ))}
    </div>
  )
}
