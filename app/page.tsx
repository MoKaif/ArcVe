'use client'

import { useState, useMemo, useEffect } from 'react'
import { FilterBar } from '@/components/filter-bar'
import { GameGrid } from '@/components/game-grid'
import { StatsOverview } from '@/components/stats-overview'
import { AddGameModal } from '@/components/add-game/add-game-modal'
import type { Game, GameStatus } from '@/types/game'
import { Gamepad2, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { SteamButton } from '@/components/steam/steam-button'
import Loading from './loading'

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<GameStatus | 'All'>('All')
  const [sortBy, setSortBy] = useState<'lastEngaged' | 'alphabetical' | 'recentlyAdded'>(
    'lastEngaged'
  )
  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false)
  const [steamHours, setSteamHours] = useState<number | null>(null)
  const searchParams = useSearchParams()

  // Real total playtime, aggregated from the Steam library.
  useEffect(() => {
    fetch('/api/steam/overview')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSteamHours(data.total_hours))
      .catch(() => {})
  }, [])

  // Fetch games from IGDB API
  useEffect(() => {
    async function fetchGames() {
      setIsLoading(true)
      console.log('[v0] Fetching games from IGDB API...')

      try {
        const response = await fetch('/api/games')
        if (!response.ok) {
          throw new Error('Failed to fetch games')
        }

        const data = await response.json()
        console.log('[v0] Received games:', data.length)
        setGames(data)
      } catch (error) {
        console.error('[v0] Error fetching games:', error)
        // Keep using mock data as fallback
        console.log('[v0] Using mock data as fallback')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [])

  const handleAddGame = async (newGame: any) => {
    console.log('[v0] Adding new game to library:', newGame.title)

    // Construct database model payload
    const payload = {
      igdb_id: parseInt(newGame.id),
      title: newGame.title,
      cover_image: newGame.coverImage,
      status: 'Backlog',
      platforms: newGame.platforms ? newGame.platforms.join(',') : '', // Assuming we get platforms from search? or default empty
      release_year: newGame.releaseYear,
      genres: newGame.genres ? newGame.genres.join(',') : '',
      description: newGame.description,
      last_engaged: 'Just now'
    }

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to save game to backend')
      }

      const savedGame = await response.json()

      const gameToAdd: Game = {
        id: savedGame.igdb_id.toString(),
        title: savedGame.title,
        coverImage: savedGame.cover_image || '/placeholder.svg',
        status: savedGame.status as GameStatus,
        platforms: savedGame.platforms ? savedGame.platforms.split(',') : [],
        lastEngaged: savedGame.last_engaged,
      }
      setGames([gameToAdd, ...games])
    } catch (error) {
      console.error('[v0] Error saving game:', error)
      // Optionally show toast error
    }
  }

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let filtered = games

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((game) =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter((game) => game.status === statusFilter)
    }

    // Sort games
    const sorted = [...filtered]
    if (sortBy === 'alphabetical') {
      sorted.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'lastEngaged') {
      // lastEngaged holds an ISO date (Steam sync writes rtime_last_played). An
      // earlier version matched against relative strings like '2 days ago', which
      // no longer occur, so every lookup missed and the sort did nothing.
      const engagedAt = (game: Game) => {
        if (!game.lastEngaged) return 0
        const parsed = Date.parse(game.lastEngaged)
        return Number.isNaN(parsed) ? 0 : parsed
      }
      sorted.sort((a, b) => engagedAt(b) - engagedAt(a))
    }
    // recentlyAdded would use creation date in real implementation

    return sorted
  }, [games, searchQuery, statusFilter, sortBy])

  const handleViewDetails = (game: Game) => {
    console.log('[v0] View details for:', game.title)
    // Will be implemented with IGDB API integration
  }

  const handleViewMedia = (game: Game) => {
    console.log('[v0] View media for:', game.title)
    // Will be implemented with IGDB API integration
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-10 md:h-14 w-32 md:w-40 transition-transform hover:scale-105 duration-300">
                <Image
                  src="/logo.png"
                  alt="ArcVe Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SteamButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <StatsOverview
          stats={{
            totalGames: games.length,
            activeGames: games.filter((g) => g.status === 'Active').length,
            finishedGames: games.filter((g) => g.status === 'Finished').length,
            totalHours: steamHours ?? 0,
          }}
        />

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onAddGame={() => setIsAddGameModalOpen(true)}
        />

        {/* Game Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading games from IGDB...</p>
          </div>
        ) : (
          <GameGrid
            games={filteredGames}
            onViewDetails={handleViewDetails}
            onViewMedia={handleViewMedia}
            onGameUpdated={(updated) =>
              setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
            }
          />
        )}
      </main>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={isAddGameModalOpen}
        onClose={() => setIsAddGameModalOpen(false)}
        onGameAdded={handleAddGame}
      />
    </div>
  )
}
