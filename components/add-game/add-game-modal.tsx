'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GameSearchInput } from './game-search-input'
import { Loader2 } from 'lucide-react'

interface GameSearchResult {
  id: string
  title: string
  coverImage: string
  releaseYear?: number
  genres?: string[]
}

interface AddGameModalProps {
  isOpen: boolean
  onClose: () => void
  onGameAdded: (game: GameSearchResult) => void
}

export function AddGameModal({ isOpen, onClose, onGameAdded }: AddGameModalProps) {
  const [selectedGame, setSelectedGame] = useState<GameSearchResult | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleSelectGame = (game: GameSearchResult) => {
    setSelectedGame(game)
  }

  const handleAddGame = async () => {
    if (!selectedGame) return

    setIsAdding(true)
    try {
      console.log('[v0] Adding game to library:', selectedGame.title)
      // Call parent handler to add game
      onGameAdded(selectedGame)
      
      // Reset and close
      setSelectedGame(null)
      onClose()
    } catch (error) {
      console.error('[v0] Error adding game:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedGame(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Game to Library</DialogTitle>
          <DialogDescription>
            Search for a game by name and add it to your personal library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Input */}
          <GameSearchInput onSelect={handleSelectGame} isLoading={isAdding} />

          {/* Selected Game Preview */}
          {selectedGame && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-4">
                {/* Cover Image */}
                <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded">
                  <img
                    src={selectedGame.coverImage || "/placeholder.svg"}
                    alt={selectedGame.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Game Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{selectedGame.title}</h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {selectedGame.releaseYear && <p>Release Year: {selectedGame.releaseYear}</p>}
                    {selectedGame.genres && selectedGame.genres.length > 0 && (
                      <p>Genres: {selectedGame.genres.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAddGame}
              disabled={!selectedGame || isAdding}
              className="gap-2"
            >
              {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
              Add to Library
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
