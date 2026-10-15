'use client'

import { GameCard } from './game-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Game } from '@/types/game'

interface GameGridProps {
  games: Game[]
  isLibraryEmpty: boolean
  onResetFilters: () => void
  onViewDetails?: (game: Game) => void
  onViewMedia?: (game: Game) => void
}

export function GameGrid({
  games,
  isLibraryEmpty,
  onResetFilters,
  onViewDetails,
  onViewMedia,
}: GameGridProps) {
  if (games.length === 0) {
    return (
      <Card className="items-center py-16 text-center">
        <CardContent className="flex flex-col items-center">
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
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {isLibraryEmpty ? 'Your library is empty' : 'No games match these filters'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isLibraryEmpty
              ? 'Add a game to start building your library'
              : 'Clear your search and status filter to see every game'}
          </p>
          {!isLibraryEmpty && (
            <Button className="mt-4" onClick={onResetFilters}>
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>
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
        />
      ))}
    </div>
  )
}
