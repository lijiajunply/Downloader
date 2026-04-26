import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'
          : 'inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'
      }
    >
      <CheckCircle2 className="size-3.5" aria-hidden="true" />
      {active ? '已启用' : '已停用'}
    </span>
  )
}

export function StatePanel({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-dashed border-border bg-card/60 p-8 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          {icon}
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  )
}

export function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function SoftEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background/60 p-5 text-sm">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  )
}
