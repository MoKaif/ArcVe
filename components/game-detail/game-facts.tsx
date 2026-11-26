'use client'

import { AlertCircle, Clock, Trophy, Star, Calendar, Building2, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type GameDetail, missingMetadata } from '@/types/game'

interface GameFactsProps {
  game: GameDetail
  onEdit: () => void
}

function formatPlaytime(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  return `${(minutes / 60).toFixed(1)}h`
}

/** Static details for a game, with a nudge toward the editor for anything absent. */
export function GameFacts({ game, onEdit }: GameFactsProps) {
  const missing = missingMetadata(game)
  const playtime = game.manualPlaytimeMinutes ?? game.playtimeMinutes ?? 0
  const isManualPlaytime = game.manualPlaytimeMinutes != null

  const facts = [
    {
      label: 'Playtime',
      icon: Clock,
      tone: 'text-purple-400',
      value: playtime > 0 ? formatPlaytime(playtime) : null,
      hint: isManualPlaytime ? 'entered manually' : game.steamAppid ? 'tracked by Steam' : undefined,
    },
    {
      label: 'Achievements',
      icon: Trophy,
      tone: 'text-amber-400',
      value:
        game.achievementsTotal
          ? `${game.achievementsUnlocked ?? 0}/${game.achievementsTotal}`
          : null,
      hint: game.achievementPct != null ? `${game.achievementPct}% complete` : undefined,
    },
    {
      label: 'Your Rating',
      icon: Star,
      tone: 'text-cyan-400',
      value: game.userRating != null ? `${game.userRating}` : null,
    },
    {
      label: 'Released',
      icon: Calendar,
      tone: 'text-blue-400',
      value: game.releaseYear ? `${game.releaseYear}` : null,
    },
  ]

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
          Details
        </h3>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit Details
        </Button>
      </div>

      {missing.length > 0 && (
        <button
          onClick={onEdit}
          className="mb-4 flex w-full items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-left text-xs text-amber-200/80 transition-colors hover:bg-amber-500/10"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Missing <span className="font-semibold">{missing.join(', ')}</span> — click to fill in.
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {facts.map((fact) => {
          const Icon = fact.icon
          return (
            <div
              key={fact.label}
              className="rounded-xl border border-white/5 bg-card/40 p-4 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${fact.tone}`} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {fact.label}
                </p>
              </div>
              <p
                className={`mt-2 text-2xl font-black tracking-tight ${
                  fact.value ? 'text-foreground' : 'text-muted-foreground/30'
                }`}
              >
                {fact.value ?? '—'}
              </p>
              {fact.value && fact.hint && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{fact.hint}</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(game.developer || game.publisher) && (
          <div className="rounded-xl border border-white/5 bg-card/40 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Studio
              </p>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              {game.developer && (
                <p className="text-foreground">
                  <span className="text-muted-foreground">Developer: </span>
                  {game.developer}
                </p>
              )}
              {game.publisher && (
                <p className="text-foreground">
                  <span className="text-muted-foreground">Publisher: </span>
                  {game.publisher}
                </p>
              )}
            </div>
          </div>
        )}

        {game.genres && game.genres.length > 0 && (
          <div className="rounded-xl border border-white/5 bg-card/40 p-4 backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Genres
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {game.genres.map((genre) => (
                <Badge key={genre} variant="outline" className="bg-muted/50 text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {game.notes && (
        <div className="mt-4 rounded-xl border border-white/5 bg-card/40 p-4 backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Your Notes
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {game.notes}
          </p>
        </div>
      )}
    </section>
  )
}
