'use client'

import { Calendar, Plus, Play, Edit3 } from 'lucide-react'
import type { TimelineEntry } from '@/types/game'
import { cn } from '@/lib/utils'

interface ActivityTimelineProps {
  timeline: TimelineEntry[]
}

const iconMap = {
  added: Plus,
  played: Play,
  recorded: Edit3,
  status_change: Calendar,
}

export function ActivityTimeline({ timeline }: ActivityTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return null
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8 text-foreground">Activity Timeline</h2>
      
      <div className="max-w-3xl">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {/* Timeline Entries */}
          <div className="space-y-8">
            {timeline.map((entry, index) => {
              const Icon = iconMap[entry.type] || Calendar
              
              return (
                <div
                  key={entry.id}
                  className="relative pl-12 animate-in fade-in slide-in-from-left-4"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'backwards',
                  }}
                >
                  {/* Icon */}
                  <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-card">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {entry.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
