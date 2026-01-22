'use client'

import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onAddGame?: () => void
}

export function SearchBar({ searchQuery, onSearchChange, onAddGame }: SearchBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search your game library..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card/50 border-border/50 focus:bg-card"
        />
      </div>
      <Button
        onClick={onAddGame}
        className="gap-2 bg-primary hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        {'Add Game'}
      </Button>
    </div>
  )
}
