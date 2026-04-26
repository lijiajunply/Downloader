import type { ReactNode } from 'react'
import { CheckCircle2, CircleAlert, SearchX } from 'lucide-react'
import { StatePanel, type LoadState } from '../pageComponents'

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-apple-sm">
          {eyebrow}
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </section>
  )
}

export function AdminPanel({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder: string
  type?: 'text' | 'email' | 'password'
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-2 text-sm leading-6 outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  )
}

export function InlineMessage({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  const isError = tone === 'error'

  return (
    <div
      className={
        isError
          ? 'flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          : 'flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary'
      }
    >
      {isError ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      <p>{message}</p>
    </div>
  )
}

export function TableShell({ children, minWidth = 680 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          style={{ minWidth }}
        >
          {children}
        </table>
      </div>
    </div>
  )
}

export function TableSkeleton({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <div key={columnIndex} className="h-5 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ResourceContent<T>({
  state,
  emptyTitle,
  emptyDescription,
  errorTitle,
  loadingColumns,
  children,
}: {
  state: LoadState<T[]>
  emptyTitle: string
  emptyDescription: string
  errorTitle: string
  loadingColumns?: number
  children: (items: T[]) => ReactNode
}) {
  if (state.status === 'loading') {
    return <TableSkeleton columns={loadingColumns} />
  }

  if (state.status === 'empty') {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StatePanel
        icon={<CircleAlert className="size-5" />}
        title={errorTitle}
        description={state.message}
      />
    )
  }

  if (state.status === 'not-found') {
    return null
  }

  return children(state.data)
}
