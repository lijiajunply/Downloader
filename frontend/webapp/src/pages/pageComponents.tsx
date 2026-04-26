import type { ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

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
      {active ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
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
    <div className="flex min-h-96 items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto max-w-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-apple-sm">
          {icon}
        </div>
        <h2 className="mt-6 text-xl font-semibold tracking-tight">{title}</h2>
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
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-apple-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function SoftEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/50 p-6 text-center text-sm">
      <p className="font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-muted-foreground/70">{description}</p>
    </div>
  )
}
