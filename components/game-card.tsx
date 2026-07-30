'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, ImageIcon, Pencil, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Game, type GameStatus, missingMetadata } from '@/types/game'
import { MetadataModal } from '@/components/game-detail/metadata-modal'

interface GameCardProps {
  game: Game
  onViewDetails?: (game: Game) => void
  onViewMedia?: (game: Game) => void
  onGameUpdated?: (game: Game) => void
}

const statusColors: Record<GameStatus, string> = {
  Backlog: 'bg-muted text-muted-foreground',
  Active: 'bg-chart-2 text-background',
  Finished: 'bg-chart-3 text-background',
  Abandoned: 'bg-muted text-muted-foreground',
}

export function GameCard({ game, onViewDetails, onViewMedia, onGameUpdated }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const handleViewDetails = () => {
    router.push(`/game/${game.id}`)
  }

  const missing = missingMetadata(game)
  const playtimeMinutes = game.manualPlaytimeMinutes ?? game.playtimeMinutes ?? 0
  const hours = playtimeMinutes / 60

  return (
    <>
    <MetadataModal
      game={game}
      isOpen={isEditing}
      onClose={() => setIsEditing(false)}
      onSaved={(updated) => onGameUpdated?.(updated)}
    />
    <Card
      className={cn(
        'group relative overflow-hidden border-border bg-card transition-all duration-300 min-w-[200px] cursor-pointer',
        'hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted/30">
        <Image
          src={game.coverImage || "/logo.png"}
          alt={game.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 16vw, 14vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 transition-opacity duration-300',
            isHovered && 'opacity-100'
          )}
        >
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
            {/* Last Engaged */}
            {game.lastEngaged && (
              <p className="text-xs text-muted-foreground">
                Last played: <span className="text-foreground">{game.lastEngaged}</span>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDetails()
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewMedia?.(game)
                }}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Media
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
            </div>
          </div>
        </div>

        {/* Status + always-visible edit. The hover overlay is unreachable on
            touch devices, so editing cannot live there alone. */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Edit details for ${game.title}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-background/70 text-muted-foreground opacity-80 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-background hover:text-foreground hover:opacity-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <Badge className={cn('text-xs font-medium', statusColors[game.status])}>
            {game.status}
          </Badge>
        </div>

        {/* Incomplete metadata marker — click to fill it in */}
        {missing.length > 0 && (
          <button
            type="button"
            title={`Missing: ${missing.join(', ')}`}
            aria-label={`Missing metadata: ${missing.join(', ')}. Click to edit.`}
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-amber-500/20 px-1.5 py-1 text-amber-300 ring-1 ring-amber-500/30 backdrop-blur-sm transition-colors hover:bg-amber-500/30"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold">{missing.length}</span>
          </button>
        )}
      </div>

      {/* Game Info */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
            {game.title}
          </h3>
          {hours > 0 && (
            <span className="flex flex-shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-muted-foreground">
              <Clock className="h-3 w-3" />
              {hours >= 1 ? `${hours.toFixed(0)}h` : `${Math.round(hours * 60)}m`}
            </span>
          )}
        </div>

        {/* Platform Badges */}
        <div className="flex flex-wrap gap-1">
          {game.platforms.map((platform) => (
            <Badge
              key={platform}
              variant="outline"
              className="text-xs px-2 py-0 h-5 bg-muted/50"
            >
              {platform}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
    </>
  )
}
