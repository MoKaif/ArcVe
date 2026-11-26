'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  coverImage: string
  releaseYear?: number
  genres?: string[]
}

interface GameSearchInputProps {
  onSelect: (game: SearchResult) => void
  isLoading?: boolean
}

export function GameSearchInput({ onSelect, isLoading: externalLoading }: GameSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Don't search for empty or very short queries
    if (query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsLoading(true)
    setShowResults(true)

    // Debounce search requests
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[v0] Searching for games:', query)
        const response = await fetch(`/api/games?query=${encodeURIComponent(query)}`)
        const data = await response.json()
        console.log('[v0] Search results:', data.length)
        setResults(data)
      } catch (error) {
        console.error('[v0] Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }, [query])

  const handleSelectGame = (game: SearchResult) => {
    console.log('[v0] Selected game:', game.title)
    onSelect(game)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for a game by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pl-10 bg-card border-border"
        />
        {(isLoading || externalLoading) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-card shadow-lg z-50',
            'max-h-96 overflow-y-auto'
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-0">
              {results.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    'hover:bg-muted/50 border-b border-border last:border-b-0'
                  )}
                >
                  {/* Game Cover */}
                  <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={game.coverImage || "/placeholder.svg"}
                      alt={game.title}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>

                  {/* Game Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{game.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {game.releaseYear && `${game.releaseYear}`}
                      {game.genres && game.genres.length > 0 && ` • ${game.genres.slice(0, 2).join(', ')}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-sm text-muted-foreground">No games found. Try another search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
