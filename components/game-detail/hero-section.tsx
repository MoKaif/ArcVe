'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { GameDetail, GameStatus } from '@/types/game'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  game: GameDetail
}

const statusColors: Record<GameStatus, string> = {
  Backlog: 'bg-muted text-muted-foreground',
  Active: 'bg-chart-2 text-background',
  Finished: 'bg-chart-3 text-background',
  Abandoned: 'bg-muted text-muted-foreground',
}

export function HeroSection({ game }: HeroSectionProps) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Blurred Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={game.coverArtwork || game.coverImage}
          alt=""
          fill
          className="object-cover blur-3xl scale-110 opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Poster Image */}
          <div className="w-full md:w-64 lg:w-80 flex-shrink-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border shadow-2xl transition-transform duration-300 hover:scale-105">
              <Image
                src={game.coverImage || "/logo.png"}
                alt={game.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 256px, 320px"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            {/* Title & Year */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance text-foreground">
                {game.title}
              </h1>
              {game.releaseYear && (
                <p className="text-lg text-muted-foreground">{game.releaseYear}</p>
              )}
            </div>

            {/* Genre Chips */}
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="px-3 py-1 text-sm bg-secondary/50 backdrop-blur-sm"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={cn('text-sm font-medium', statusColors[game.status])}>
                {game.status}
              </Badge>
            </div>

            {/* Platforms */}
            {game.platforms && game.platforms.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Platforms:</span>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant="outline"
                      className="text-xs bg-muted/30 backdrop-blur-sm"
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Developer & Publisher */}
            {(game.developer || game.publisher) && (
              <div className="space-y-1 text-sm">
                {game.developer && (
                  <p>
                    <span className="text-muted-foreground">Developer:</span>{' '}
                    <span className="text-foreground">{game.developer}</span>
                  </p>
                )}
                {game.publisher && (
                  <p>
                    <span className="text-muted-foreground">Publisher:</span>{' '}
                    <span className="text-foreground">{game.publisher}</span>
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            {game.description && (
              <p className="text-base leading-relaxed text-muted-foreground max-w-3xl text-pretty">
                {game.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
