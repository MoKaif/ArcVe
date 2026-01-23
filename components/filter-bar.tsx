'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'
import type { GameStatus } from '@/types/game'

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: GameStatus | 'All'
  onStatusFilterChange: (value: GameStatus | 'All') => void
  sortBy: 'lastEngaged' | 'alphabetical' | 'recentlyAdded'
  onSortByChange: (value: 'lastEngaged' | 'alphabetical' | 'recentlyAdded') => void
  onAddGame?: () => void
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  onAddGame,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Filters and Add Button */}
      <div className="flex gap-2 sm:gap-3 items-center">
        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusFilterChange(value as GameStatus | 'All')}
        >
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Backlog">Backlog</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Finished">Finished</SelectItem>
            <SelectItem value="Abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value) =>
            onSortByChange(value as 'lastEngaged' | 'alphabetical' | 'recentlyAdded')
          }
        >
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastEngaged">Last Engaged</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="recentlyAdded">Recently Added</SelectItem>
          </SelectContent>
        </Select>

        {/* Add Game Button */}
        <Button
          onClick={onAddGame}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Game</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </div>
  )
}
