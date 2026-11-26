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
            className="group relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/10"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20 transition-opacity duration-500 group-hover:opacity-40`} />
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tight text-foreground">{stat.value}</p>
                </div>
                <div className={`rounded-xl bg-background/40 p-3 shadow-inner ring-1 ring-white/10 ${stat.iconColor} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-700 group-hover:w-full" />
          </Card>
        )
      })}
    </div>
  )
}
