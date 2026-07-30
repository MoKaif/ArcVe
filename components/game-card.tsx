'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Game, GameStatus } from '@/types/game'

interface GameCardProps {
  game: Game
  onViewDetails?: (game: Game) => void
  onViewMedia?: (game: Game) => void
}

const statusColors: Record<GameStatus, string> = {
  Backlog: 'bg-muted text-muted-foreground',
  Active: 'bg-chart-2 text-background',
  Finished: 'bg-chart-3 text-background',
  Abandoned: 'bg-muted text-muted-foreground',
}

export function GameCard({ game, onViewDetails, onViewMedia }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  const handleViewDetails = () => {
    router.push(`/game/${game.id}`)
  }

  return (
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
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge className={cn('text-xs font-medium', statusColors[game.status])}>
            {game.status}
          </Badge>
        </div>
      </div>

      {/* Game Info */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
          {game.title}
        </h3>

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
  )
}
