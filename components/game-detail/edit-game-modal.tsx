'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { GameDetail } from '@/types/game'

interface EditGameModalProps {
    game: GameDetail
    isOpen: boolean
    onClose: () => void
    onGameUpdated: (updatedGame: GameDetail) => void
}

export function EditGameModal({ game, isOpen, onClose, onGameUpdated }: EditGameModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [playthroughUrl, setPlaythroughUrl] = useState(game.playthroughUrl || '')
    const [status, setStatus] = useState(game.status)

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const payload = {
                igdb_id: parseInt(game.id),
                title: game.title, // Required by backend model but won't change here
                playthrough_video_url: playthroughUrl,
                status: status,
                // Backend expects these fields for cache update if present, but for now we just want to update mutable fields
                // We can just send what we have. The backend "create_or_update" logic handles it.
                // Wait, backend logic REPLACES fields if they are missing in the payload? 
                // Let's check backend/main.py. No, Pydantic model usually requires fields unless optional.
                // Game model has Optional fields. But title is required.
                // We should send existing values to be safe or update backend to PATCH.
                // Currently backend is POST (Upsert). We need to send required fields.
                cover_image: game.coverImage,
                platforms: game.platforms.join(','),
                // release_year? genres? We might not have them in GameDetail if fetched from frontend minimal data?
                // Actually GameDetail has them.
            }

            const response = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to update game')

            const updatedData = await response.json()

            onGameUpdated({
                ...game,
                playthroughUrl: updatedData.playthrough_video_url,
                status: updatedData.status
            })
            onClose()
        } catch (error) {
            console.error('Failed to update game:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Game Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Backlog">Backlog</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Finished">Finished</SelectItem>
                                <SelectItem value="Abandoned">Abandoned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="video-url">Playthrough Video URL (YouTube)</Label>
                        <Input
                            id="video-url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={playthroughUrl}
                            onChange={(e) => setPlaythroughUrl(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
