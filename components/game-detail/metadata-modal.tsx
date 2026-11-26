'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Game, type GameStatus, missingMetadata } from '@/types/game'

interface MetadataModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onSaved: (game: Game) => void
}

/** Blank strings mean "leave unset" rather than "write an empty value". */
function trimmed(value: string) {
  const clean = value.trim()
  return clean.length ? clean : undefined
}

export function MetadataModal({ game, isOpen, onClose, onSaved }: MetadataModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState<GameStatus>(game.status)
  const [coverImage, setCoverImage] = useState(game.coverImage === '/logo.png' ? '' : game.coverImage)
  const [releaseYear, setReleaseYear] = useState(game.releaseYear?.toString() ?? '')
  const [platforms, setPlatforms] = useState(game.platforms?.join(', ') ?? '')
  const [genres, setGenres] = useState(game.genres?.join(', ') ?? '')
  const [description, setDescription] = useState(game.description ?? '')
  const [notes, setNotes] = useState(game.notes ?? '')
  const [rating, setRating] = useState(game.userRating?.toString() ?? '')
  const [playthroughUrl, setPlaythroughUrl] = useState(game.playthroughUrl ?? '')
  const [manualHours, setManualHours] = useState(
    game.manualPlaytimeMinutes ? (game.manualPlaytimeMinutes / 60).toString() : ''
  )

  // Re-seed the form whenever a different game opens the dialog.
  useEffect(() => {
    if (!isOpen) return
    setStatus(game.status)
    setCoverImage(game.coverImage === '/logo.png' ? '' : game.coverImage)
    setReleaseYear(game.releaseYear?.toString() ?? '')
    setPlatforms(game.platforms?.join(', ') ?? '')
    setGenres(game.genres?.join(', ') ?? '')
    setDescription(game.description ?? '')
    setNotes(game.notes ?? '')
    setRating(game.userRating?.toString() ?? '')
    setPlaythroughUrl(game.playthroughUrl ?? '')
    setManualHours(game.manualPlaytimeMinutes ? (game.manualPlaytimeMinutes / 60).toString() : '')
    setError(null)
  }, [isOpen, game])

  const missing = missingMetadata(game)
  const isSteamGame = Boolean(game.steamAppid)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const hours = parseFloat(manualHours)
      const year = parseInt(releaseYear, 10)
      const parsedRating = parseFloat(rating)

      // PATCH writes only what is sent, so omitting a field leaves it untouched.
      const payload: Record<string, unknown> = {
        status,
        cover_image: trimmed(coverImage),
        release_year: Number.isFinite(year) ? year : undefined,
        platforms: trimmed(platforms)
          ?.split(',')
          .map((p) => p.trim())
          .filter(Boolean)
          .join(','),
        genres: trimmed(genres)
          ?.split(',')
          .map((g) => g.trim())
          .filter(Boolean)
          .join(','),
        description: trimmed(description),
        notes: trimmed(notes),
        user_rating: Number.isFinite(parsedRating) ? parsedRating : undefined,
        playthrough_video_url: trimmed(playthroughUrl),
        manual_playtime_minutes: Number.isFinite(hours) ? Math.round(hours * 60) : undefined,
      }

      Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])

      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Could not save changes')
      }

      const saved = await res.json()
      onSaved({
        ...game,
        status: saved.status,
        coverImage: saved.cover_image || '/logo.png',
        releaseYear: saved.release_year ?? undefined,
        platforms: saved.platforms ? saved.platforms.split(',').filter(Boolean) : [],
        genres: saved.genres ? saved.genres.split(',').filter(Boolean) : [],
        description: saved.description ?? undefined,
        notes: saved.notes ?? undefined,
        userRating: saved.user_rating ?? undefined,
        playthroughUrl: saved.playthrough_video_url ?? undefined,
        manualPlaytimeMinutes: saved.manual_playtime_minutes ?? undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-left">
            <span className="block text-lg font-black tracking-tight">Edit Details</span>
            <span className="block truncate text-xs font-medium text-muted-foreground">{game.title}</span>
          </DialogTitle>
        </DialogHeader>

        {missing.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-200/80">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Missing: <span className="font-semibold">{missing.join(', ')}</span>
            </span>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as GameStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Finished">Finished</SelectItem>
                <SelectItem value="Abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="year">Release Year</Label>
              <Input
                id="year"
                inputMode="numeric"
                placeholder="2018"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Your Rating</Label>
              <Input
                id="rating"
                inputMode="decimal"
                placeholder="8.5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">
              Playtime (hours)
              {isSteamGame && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  — tracked by Steam ({((game.playtimeMinutes ?? 0) / 60).toFixed(1)}h)
                </span>
              )}
            </Label>
            <Input
              id="hours"
              inputMode="decimal"
              placeholder={isSteamGame ? 'Overrides the Steam value' : 'e.g. 42'}
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platforms">Platforms</Label>
            <Input
              id="platforms"
              placeholder="PC, PlayStation 5"
              value={platforms}
              onChange={(e) => setPlatforms(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Comma separated</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genres">Genres</Label>
            <Input
              id="genres"
              placeholder="RPG, Adventure"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Comma separated</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image URL</Label>
            <Input
              id="cover"
              placeholder="https://…"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Playthrough Video URL</Label>
            <Input
              id="video"
              placeholder="https://www.youtube.com/watch?v=…"
              value={playthroughUrl}
              onChange={(e) => setPlaythroughUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="What is this game about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Personal Notes</Label>
            <textarea
              id="notes"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Anything you want to remember"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
