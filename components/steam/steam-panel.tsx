'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Clock, Gamepad2, Loader2, RefreshCw, Trophy, PackageOpen } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SteamIcon } from './steam-icon'

interface SteamGame {
  igdb_id: number
  steam_appid: number
  title: string
  cover_image: string | null
  status: string | null
  hours: number
  minutes: number
  playtime_2weeks: number
  last_played: string | null
  achievement_pct: number | null
  achievements_unlocked: number | null
  achievements_total: number | null
}

interface Overview {
  total_games: number
  total_hours: number
  played_count: number
  never_played_count: number
  active_count: number
  achievements_available: boolean
  avg_completion: number | null
  games: SteamGame[]
}

interface Status {
  persona: string | null
  avatar: string | null
  online: boolean
  playing: string | null
}

const statusTone: Record<string, string> = {
  Active: 'bg-green-500/15 text-green-400 ring-green-500/30',
  Finished: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  Abandoned: 'bg-rose-500/15 text-rose-400 ring-rose-500/30',
  Backlog: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
}

function formatHours(hours: number) {
  if (hours === 0) return 'Never launched'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  return `${hours}h`
}

export function SteamPanel() {
  const [open, setOpen] = useState(false)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, statusRes] = await Promise.all([
        fetch('/api/steam/overview', { cache: 'no-store' }),
        fetch('/api/steam/status', { cache: 'no-store' }),
      ])
      if (!overviewRes.ok) throw new Error('Could not load your Steam library')
      setOverview(await overviewRes.json())
      if (statusRes.ok) setStatus(await statusRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  // The "now playing" pill is visible on the closed button, so status is polled
  // regardless of whether the panel has been opened.
  useEffect(() => {
    fetch('/api/steam/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setStatus(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const sync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/steam/sync', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Sync failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const maxHours = overview?.games.reduce((max, g) => Math.max(max, g.hours), 0) || 1

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Steam library and stats"
          className="group relative flex items-center gap-2 rounded-xl border border-white/10 bg-card/40 px-3 py-2 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/10"
        >
          <SteamIcon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
          {status?.playing ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="hidden max-w-[10rem] truncate sm:inline">{status.playing}</span>
            </span>
          ) : (
            <span className="hidden text-xs font-bold uppercase tracking-wider text-muted-foreground/80 sm:inline">
              Steam
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden border-white/10 bg-background/95 p-0 backdrop-blur-2xl sm:max-w-3xl">
        <DialogHeader className="border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-left">
            <span className="rounded-xl bg-background/50 p-2.5 text-foreground shadow-inner ring-1 ring-white/10">
              <SteamIcon className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-black tracking-tight">Steam Library</span>
              <span className="block truncate text-xs font-medium text-muted-foreground">
                {status?.playing
                  ? `Playing ${status.playing}`
                  : status?.persona
                    ? `${status.persona} · ${status.online ? 'Online' : 'Offline'}`
                    : 'Connected'}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(85vh-5.5rem)] overflow-y-auto">
          {loading && !overview ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your library…</p>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-rose-400">{error}</p>
              <button
                onClick={load}
                className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-card/60"
              >
                Try again
              </button>
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 gap-3 px-6 py-5 lg:grid-cols-4">
                <StatTile
                  label="Total Playtime"
                  value={`${overview.total_hours}h`}
                  icon={Clock}
                  tone="text-purple-400"
                  gradient="from-purple-500/10 to-pink-500/10"
                />
                <StatTile
                  label="Games"
                  value={overview.total_games}
                  icon={Gamepad2}
                  tone="text-blue-400"
                  gradient="from-blue-500/10 to-cyan-500/10"
                />
                <StatTile
                  label="Never Launched"
                  value={overview.never_played_count}
                  icon={PackageOpen}
                  tone="text-slate-400"
                  gradient="from-slate-500/10 to-zinc-500/10"
                />
                <StatTile
                  label="Avg Completion"
                  value={overview.avg_completion !== null ? `${overview.avg_completion}%` : '—'}
                  icon={Trophy}
                  tone="text-amber-400"
                  gradient="from-amber-500/10 to-yellow-500/10"
                />
              </div>

              {!overview.achievements_available && (
                <p className="mx-6 mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-200/80">
                  Steam is withholding achievement data for this profile. Set{' '}
                  <span className="font-semibold">Game details</span> to Public in your{' '}
                  <a
                    href="https://steamcommunity.com/my/edit/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-amber-100"
                  >
                    privacy settings
                  </a>
                  , then sync again.
                </p>
              )}

              <div className="flex items-center justify-between border-y border-white/5 bg-card/20 px-6 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Most Played
                </span>
                <button
                  onClick={sync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing…' : 'Sync'}
                </button>
              </div>

              <ul className="divide-y divide-white/5">
                {overview.games.map((game) => (
                  <li
                    key={game.steam_appid}
                    className="group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-card/40"
                  >
                    <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted/30 ring-1 ring-white/5">
                      {game.cover_image && (
                        <Image
                          src={game.cover_image}
                          alt={game.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-foreground">{game.title}</p>
                        <span className="flex-shrink-0 text-sm font-bold tabular-nums text-foreground">
                          {formatHours(game.hours)}
                        </span>
                      </div>

                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                          style={{ width: `${Math.max((game.hours / maxHours) * 100, game.hours > 0 ? 2 : 0)}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {game.status && (
                          <span
                            className={`rounded px-1.5 py-0.5 font-semibold ring-1 ${
                              statusTone[game.status] || statusTone.Backlog
                            }`}
                          >
                            {game.status}
                          </span>
                        )}
                        {game.playtime_2weeks > 0 && (
                          <span className="font-medium text-green-400">
                            +{Math.round(game.playtime_2weeks / 60)}h in 2 weeks
                          </span>
                        )}
                        {game.achievement_pct !== null && (
                          <span>
                            {game.achievements_unlocked}/{game.achievements_total} achievements
                          </span>
                        )}
                        {game.last_played && <span className="ml-auto">Last played {game.last_played}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  gradient,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  tone: string
  gradient: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-card/40 p-4 backdrop-blur-xl transition-all duration-500 hover:border-primary/40">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 transition-opacity duration-500 group-hover:opacity-40`} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {label}
          </p>
          <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
        </div>
        <span className={`rounded-lg bg-background/40 p-2 shadow-inner ring-1 ring-white/10 ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
