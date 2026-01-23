'use client'

import { useState, useMemo, useEffect } from 'react'
import { FilterBar } from '@/components/filter-bar'
import { GameGrid } from '@/components/game-grid'
import { StatsOverview } from '@/components/stats-overview'
import { AddGameModal } from '@/components/add-game/add-game-modal'
import type { Game, GameStatus } from '@/types/game'
import { Gamepad2, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Loading from './loading'

// Mock data
const mockGames: Game[] = [
  {
    id: '1',
    title: 'The Legend of Zelda: Breath of the Wild',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg',
    status: 'Finished',
    platforms: ['Switch', 'Wii U'],
    lastEngaged: '2 days ago',
  },
  {
    id: '2',
    title: 'Elden Ring',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
    status: 'Active',
    platforms: ['PC', 'PS5'],
    lastEngaged: '1 hour ago',
  },
  {
    id: '3',
    title: 'Hollow Knight',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg',
    status: 'Backlog',
    platforms: ['PC', 'Switch'],
    lastEngaged: '3 weeks ago',
  },
  {
    id: '4',
    title: 'Cyberpunk 2077',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2of0.jpg',
    status: 'Abandoned',
    platforms: ['PC', 'PS5', 'Xbox'],
    lastEngaged: '6 months ago',
  },
  {
    id: '5',
    title: 'Red Dead Redemption 2',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
    status: 'Finished',
    platforms: ['PC', 'PS4', 'Xbox'],
    lastEngaged: '1 month ago',
  },
  {
    id: '6',
    title: 'Hades',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2i8m.jpg',
    status: 'Active',
    platforms: ['PC', 'Switch'],
    lastEngaged: '3 days ago',
  },
  {
    id: '7',
    title: 'The Witcher 3: Wild Hunt',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
    status: 'Finished',
    platforms: ['PC', 'PS4', 'Switch'],
    lastEngaged: '2 months ago',
  },
  {
    id: '8',
    title: 'Stardew Valley',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49wj.jpg',
    status: 'Active',
    platforms: ['PC', 'Mobile'],
    lastEngaged: '5 days ago',
  },
  {
    id: '9',
    title: 'God of War Ragnarök',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg',
    status: 'Backlog',
    platforms: ['PS5'],
    lastEngaged: 'Never',
  },
  {
    id: '10',
    title: 'Celeste',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgs.jpg',
    status: 'Finished',
    platforms: ['PC', 'Switch'],
    lastEngaged: '4 months ago',
  },
  {
    id: '11',
    title: 'Dark Souls III',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wzi.jpg',
    status: 'Active',
    platforms: ['PC', 'PS4'],
    lastEngaged: '1 week ago',
  },
  {
    id: '12',
    title: 'Portal 2',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rs5.jpg',
    status: 'Finished',
    platforms: ['PC', 'Xbox'],
    lastEngaged: '1 year ago',
  },
]

export default function HomePage() {
  const [games, setGames] = useState<Game[]>(mockGames)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<GameStatus | 'All'>('All')
  const [sortBy, setSortBy] = useState<'lastEngaged' | 'alphabetical' | 'recentlyAdded'>(
    'lastEngaged'
  )
  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false)
  const searchParams = useSearchParams()

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

  const handleAddGame = (newGame: any) => {
    console.log('[v0] Adding new game to library:', newGame.title)
    const gameToAdd: Game = {
      id: newGame.id,
      title: newGame.title,
      coverImage: newGame.coverImage,
      status: 'Backlog',
      platforms: [],
      lastEngaged: 'Just now',
    }
    setGames([gameToAdd, ...games])
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
      // This is a simple example - you would implement proper date comparison
      const engagementPriority: Record<string, number> = {
        '1 hour ago': 1,
        '2 days ago': 2,
        '3 days ago': 3,
        '5 days ago': 4,
        '1 week ago': 5,
        '3 weeks ago': 6,
        '1 month ago': 7,
        '2 months ago': 8,
        '4 months ago': 9,
        '6 months ago': 10,
        '1 year ago': 11,
        Never: 12,
      }
      sorted.sort(
        (a, b) =>
          (engagementPriority[a.lastEngaged || 'Never'] || 99) -
          (engagementPriority[b.lastEngaged || 'Never'] || 99)
      )
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Gamepad2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">ArcVe</h1>
                <p className="text-xs text-muted-foreground">Game Library</p>
              </div>
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
            totalHours: 342, // Mock data
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
