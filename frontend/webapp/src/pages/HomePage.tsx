import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Box, ChevronRight, CircleAlert, Package, Sparkles } from 'lucide-react'
import { getApps } from '@/services'
import type { AppDto } from '@/types'
import { type LoadState, StatePanel, StatusBadge } from './pageComponents'
import { getErrorMessage } from './pageUtils'

export function HomePage() {
  const [state, setState] = useState<LoadState<AppDto[]>>({ status: 'loading' })

  useEffect(() => {
    let ignore = false

    async function loadApps() {
      setState({ status: 'loading' })

      try {
        const apps = await getApps()
        if (ignore) return
        setState(apps.length > 0 ? { status: 'success', data: apps } : { status: 'empty' })
      } catch (error) {
        if (ignore) return
        setState({ status: 'error', message: getErrorMessage(error) })
      }
    }

    void loadApps()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Apple-style hero */}
      <section className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-apple-sm backdrop-blur-sm">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            应用分发中心
          </div>
          <div className="space-y-4">
            <h1 className="text-balance text-[2.25rem] font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              当前可用的应用
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              浏览已接入 Downloader 的应用，查看最新发行版、软件包渠道和用户协议。
            </p>
          </div>
        </div>

        {/* macOS-style stats card */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-apple-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">状态</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">
                {state.status === 'success' ? `${state.data.length} 个应用` : '加载中…'}
              </p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-apple-sm">
              <Package className="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </section>

      {/* App list */}
      <section aria-label="应用列表">
        {state.status === 'loading' && <LoadingGrid />}
        {state.status === 'empty' && (
          <StatePanel
            icon={<Box className="size-5" />}
            title="暂无应用"
            description="后端当前没有返回应用。创建应用后，它们会出现在这里。"
          />
        )}
        {state.status === 'error' && (
          <StatePanel
            icon={<CircleAlert className="size-5" />}
            title="应用加载失败"
            description={state.message}
          />
        )}
        {state.status === 'success' && <AppGrid apps={state.data} />}
      </section>
    </div>
  )
}

function AppGrid({ apps }: { apps: AppDto[] }) {
  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {apps.map((app) => (
        <Link
          key={app.id}
          to={`/apps/${encodeURIComponent(app.id)}`}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 shadow-apple-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-apple-lg"
        >
          {/* Card top accent */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />

          <div className="flex items-start justify-between gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-apple-sm">
              <Package className="size-5" aria-hidden="true" />
            </span>
            <StatusBadge active={app.isActive} />
          </div>
          <div className="mt-5 space-y-2.5">
            <h2 className="line-clamp-1 text-lg font-semibold tracking-tight">{app.name}</h2>
            <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
              {app.description || '这个应用暂未填写描述。'}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-sm font-medium">
            <span className="text-muted-foreground">查看详情</span>
            <ChevronRight className="size-4 text-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </Link>
      ))}
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-apple-sm"
        >
          <div className="flex items-center justify-between">
            <div className="size-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-6 w-18 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-6 h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-3.5 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-5/6 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-6 h-px bg-border/40" />
          <div className="mt-4 h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
