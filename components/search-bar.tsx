'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  onAddGame?: () => void
}

export function SearchBar({ onAddGame }: SearchBarProps) {
  return (
    <div className="flex justify-end">
      <Button
        onClick={onAddGame}
        className="gap-2 bg-primary hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Game
      </Button>
    </div>
  )
}
