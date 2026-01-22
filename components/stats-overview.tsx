'use client'

import { Clock, Trophy, Gamepad2, Archive } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatsOverviewProps {
  stats: {
    totalGames: number
    activeGames: number
    finishedGames: number
    totalHours: number
  }
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      label: 'Total Games',
      value: stats.totalGames,
      icon: Archive,
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Currently Playing',
      value: stats.activeGames,
      icon: Gamepad2,
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-400',
    },
    {
      label: 'Completed',
      value: stats.finishedGames,
      icon: Trophy,
      gradient: 'from-amber-500/10 to-yellow-500/10',
      iconColor: 'text-amber-400',
    },
    {
      label: 'Total Hours',
      value: stats.totalHours,
      icon: Clock,
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all hover:border-border hover:bg-card/80"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-lg bg-background/50 p-3 ${stat.iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
