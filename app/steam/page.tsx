'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  Gamepad2,
  Loader2,
  PackageOpen,
  RefreshCw,
  Trophy,
  TrendingUp,
  Link2Off,
} from 'lucide-react'

import { SteamIcon } from '@/components/steam/steam-icon'

interface SteamGame {
  igdb_id: number
  steam_appid: number
  title: string
  cover_image: string | null
  status: string | null
  hours: number
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

interface History {
  total_minutes: number
  series: { date: string; minutes: number }[]
  top_games: { title: string; minutes: number }[]
}

interface Unmatched {
  steam_appid: number
  name: string | null
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

export default function SteamPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [history, setHistory] = useState<History | null>(null)
  const [unmatched, setUnmatched] = useState<Unmatched[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [o, s, h, u] = await Promise.all([
        fetch('/api/steam/overview', { cache: 'no-store' }),
        fetch('/api/steam/status', { cache: 'no-store' }),
        fetch('/api/steam/history?days=30', { cache: 'no-store' }),
        fetch('/api/steam/unmatched', { cache: 'no-store' }),
      ])
      if (!o.ok) throw new Error('Could not load your Steam library')
      setOverview(await o.json())
      if (s.ok) setStatus(await s.json())
      if (h.ok) setHistory(await h.json())
      if (u.ok) setUnmatched(await u.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sync = async (withAchievements: boolean) => {
    setSyncing(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/steam/sync${withAchievements ? '?achievements=1' : ''}`, {
        method: 'POST',
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Sync failed')
      if (withAchievements && body.achievements === null) {
        setNotice('Library synced, but Steam declined to share achievements.')
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const maxHours = overview?.games.reduce((max, g) => Math.max(max, g.hours), 0) || 1
  const maxDay = history?.series.reduce((max, d) => Math.max(max, d.minutes), 0) || 1
  const neverPlayed = overview?.games.filter((g) => g.hours === 0) ?? []
  const played = overview?.games.filter((g) => g.hours > 0) ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Back to library"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-card/40 text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex min-w-0 items-center gap-3">
              {status?.avatar ? (
                <Image
                  src={status.avatar}
                  alt={status.persona || 'Steam avatar'}
                  width={40}
                  height={40}
                  className="h-10 w-10 flex-shrink-0 rounded-lg ring-1 ring-white/10"
                />
              ) : (
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-card/50 ring-1 ring-white/10">
                  <SteamIcon className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black leading-tight tracking-tight">
                  {status?.persona || 'Steam Library'}
                </h1>
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {status?.playing ? (
                    <span className="flex items-center gap-1.5 text-green-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                      </span>
                      Playing {status.playing}
                    </span>
                  ) : status ? (
                    status.online ? 'Online' : 'Offline'
                  ) : (
                    'Connected'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => sync(false)}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-card/40 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync'}</span>
            </button>
            <button
              onClick={() => sync(true)}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Full Sync</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your Steam data…</p>
          </div>
        ) : error ? (
          <div className="py-32 text-center">
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
            {notice && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
                {notice}
              </p>
            )}

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile
                label="Total Playtime"
                value={`${overview.total_hours}h`}
                icon={Clock}
                tone="text-purple-400"
                gradient="from-purple-500/10 to-pink-500/10"
              />
              <StatTile
                label="Games Owned"
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
            </section>

            {!overview.achievements_available && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-200/80">
                Steam is withholding achievement data. Set{' '}
                <span className="font-semibold">Game details</span> to Public in your{' '}
                <a
                  href="https://steamcommunity.com/my/edit/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-amber-100"
                >
                  Steam privacy settings
                </a>
                , then run a Full Sync.
              </p>
            )}

            {/* Playtime history. Only exists from the first sync onward, because
                Steam serves no historical data to backfill from. */}
            <section className="rounded-2xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                    Last 30 Days
                  </h2>
                  <p className="mt-1 text-2xl font-black tracking-tight">
                    {history ? `${(history.total_minutes / 60).toFixed(1)}h` : '0h'}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
              </div>

              {history && history.series.length > 0 ? (
                <div className="flex h-32 items-end gap-1">
                  {history.series.map((day) => (
                    <div key={day.date} className="group relative flex-1" title={`${day.date}: ${Math.round(day.minutes)}m`}>
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-blue-600 to-cyan-400 transition-opacity hover:opacity-80"
                        style={{ height: `${Math.max((day.minutes / maxDay) * 128, 3)}px` }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-xs leading-relaxed text-muted-foreground">
                  No history yet. Steam only reports a running total, so ArcVe builds this
                  chart by comparing snapshots — play something and sync again to see the
                  first bar.
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Played · {played.length}
              </h2>
              <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-card/30 backdrop-blur-xl">
                {played.map((game) => (
                  <GameRow key={game.steam_appid} game={game} maxHours={maxHours} />
                ))}
              </ul>
            </section>

            {neverPlayed.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                  Never Launched · {neverPlayed.length}
                </h2>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {neverPlayed.map((game) => (
                    <Link
                      key={game.steam_appid}
                      href={`/game/${game.igdb_id}`}
                      className="group space-y-2"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted/30 ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-105">
                        {game.cover_image && (
                          <Image
                            src={game.cover_image}
                            alt={game.title}
                            fill
                            sizes="120px"
                            className="object-cover opacity-60 transition-opacity group-hover:opacity-100"
                          />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs font-medium text-muted-foreground">
                        {game.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {unmatched.length > 0 && (
              <section className="rounded-2xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                  <Link2Off className="h-4 w-4" />
                  Unmatched · {unmatched.length}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Owned on Steam but absent from IGDB, so they have no artwork or metadata.
                  Playtime is still recorded against them.
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {unmatched.map((app) => (
                    <li
                      key={app.steam_appid}
                      className="rounded-lg bg-background/40 px-2.5 py-1.5 text-xs text-muted-foreground ring-1 ring-white/5"
                    >
                      {app.name || `App ${app.steam_appid}`}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}

function GameRow({ game, maxHours }: { game: SteamGame; maxHours: number }) {
  return (
    <li className="group transition-colors hover:bg-card/40">
      <Link href={`/game/${game.igdb_id}`} className="flex items-center gap-4 px-5 py-3.5">
        <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-md bg-muted/30 ring-1 ring-white/5">
          {game.cover_image && (
            <Image src={game.cover_image} alt={game.title} fill sizes="44px" className="object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-semibold text-foreground">{game.title}</p>
            <span className="flex-shrink-0 text-sm font-bold tabular-nums">{formatHours(game.hours)}</span>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${Math.max((game.hours / maxHours) * 100, 2)}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
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
                +{(game.playtime_2weeks / 60).toFixed(1)}h in 2 weeks
              </span>
            )}
            {game.achievement_pct !== null && (
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {game.achievements_unlocked}/{game.achievements_total} ({game.achievement_pct}%)
              </span>
            )}
            {game.last_played && <span className="ml-auto">Last played {game.last_played}</span>}
          </div>
        </div>
      </Link>
    </li>
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
    <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-card/40 p-5 backdrop-blur-xl transition-all duration-500 hover:border-primary/40">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 transition-opacity duration-500 group-hover:opacity-40`} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {label}
          </p>
          <p className="text-2xl font-black tracking-tight lg:text-3xl">{value}</p>
        </div>
        <span className={`rounded-lg bg-background/40 p-2.5 shadow-inner ring-1 ring-white/10 ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
