import { Monitor, Smartphone, Gamepad } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PlatformBadgeProps {
  platform: string
  className?: string
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const getPlatformIcon = (platform: string) => {
    const lower = platform.toLowerCase()
    if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android')) {
      return Smartphone
    }
    if (lower.includes('pc') || lower.includes('mac')) {
      return Monitor
    }
    return Gamepad
  }

  const Icon = getPlatformIcon(platform)

  return (
    <Badge variant="secondary" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {platform}
    </Badge>
  )
}
