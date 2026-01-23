'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroSection } from '@/components/game-detail/hero-section'
import { ActivityTimeline } from '@/components/game-detail/activity-timeline'
import { MediaSection } from '@/components/game-detail/media-section'
import { EditGameModal } from '@/components/game-detail/edit-game-modal'
import type { GameDetail } from '@/types/game'

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [game, setGame] = useState<GameDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    async function fetchGameDetail() {
      setIsLoading(true)
      console.log('[v0] Fetching game detail for ID:', params.id)

      try {
        const response = await fetch(`/api/games/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch game details')
        }

        const data = await response.json()
        console.log('[v0] Game detail loaded:', data.title)
        setGame(data)
      } catch (error) {
        console.error('[v0] Error fetching game detail:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchGameDetail()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading game details...</p>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Game Not Found</h2>
          <Button onClick={() => router.push('/')} variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="group transition-all duration-200 hover:translate-x-[-4px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-[-2px]" />
          Back to Library
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
          Edit Game
        </Button>
      </div>

      {/* Hero Section */}
      <HeroSection game={game} />

      {/* Activity Timeline */}
      {game.timeline && game.timeline.length > 0 && (
        <ActivityTimeline timeline={game.timeline} />
      )}

      {/* Playthrough Section */}
      {game.playthroughUrl && (
        <section className="container mx-auto px-4 py-8">
          <h3 className="text-xl font-bold mb-4 text-foreground">My Playthrough</h3>
          <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden bg-black border border-border shadow-lg">
            <iframe
              src={game.playthroughUrl.includes('watch?v=') ? game.playthroughUrl.replace('watch?v=', 'embed/') : game.playthroughUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Media Section */}
      {game.videos && game.videos.length > 0 && <MediaSection videos={game.videos} />}

      {/* Spacer */}
      <div className="h-20" />

      <EditGameModal
        game={game}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onGameUpdated={(updatedGame) => setGame(updatedGame)}
      />
    </div>
  )
}
