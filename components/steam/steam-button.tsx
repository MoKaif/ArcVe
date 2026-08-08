'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { SteamIcon } from './steam-icon'

interface Status {
  persona: string | null
  online: boolean
  playing: string | null
}

/** Header entry point to /steam. Shows a live pill while a game is running. */
export function SteamButton() {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    const load = () =>
      fetch('/api/steam/status', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setStatus(data))
        .catch(() => {})

    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Link
      href="/steam"
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
    </Link>
  )
}
