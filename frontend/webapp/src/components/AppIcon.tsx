import { Package } from 'lucide-react'
import { resolveApiUrl } from '@/services'
import { cn } from '@/lib/utils'

interface AppIconProps {
  name: string
  iconUrl?: string
  className?: string
  imageClassName?: string
  fallbackClassName?: string
}

export function AppIcon({
  name,
  iconUrl,
  className,
  imageClassName,
  fallbackClassName,
}: AppIconProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] border border-border/40 bg-linear-to-br from-primary/10 to-primary/5 text-primary',
        className,
      )}
    >
      {iconUrl ? (
        <img
          src={resolveApiUrl(iconUrl)}
          alt={`${name} 图标`}
          className={cn('size-full object-cover', imageClassName)}
          loading="lazy"
        />
      ) : (
        <Package className={cn('size-1/2', fallbackClassName)} strokeWidth={1.5} aria-hidden="true" />
      )}
    </div>
  )
}
