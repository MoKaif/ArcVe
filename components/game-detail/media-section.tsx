'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, X } from 'lucide-react'
import type { GameVideo } from '@/types/game'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MediaSectionProps {
  videos: GameVideo[]
}

export function MediaSection({ videos }: MediaSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<GameVideo | null>(null)

  if (!videos || videos.length === 0) {
    return null
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8 text-foreground">Videos & Media</h2>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="group cursor-pointer animate-in fade-in zoom-in-95"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'backwards',
            }}
            onClick={() => setSelectedVideo(video)}
          >
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
              {/* Thumbnail */}
              <Image
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-primary/90 p-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary">
                  <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                </div>
              </div>

              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                  {video.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl mx-4 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-muted hover:bg-muted/80"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Video Player */}
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>

            {/* Video Title */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">{selectedVideo.title}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
