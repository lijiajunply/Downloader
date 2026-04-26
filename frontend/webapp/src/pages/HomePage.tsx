import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Box, ChevronRight, CircleAlert, Layers3, Package, Sparkles } from 'lucide-react'
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
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="max-w-3xl space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            应用分发中心
          </p>
          <div className="space-y-3">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              当前可用的应用
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              浏览已接入 Downloader 的应用，查看最新发行版、软件包渠道和用户协议。
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">状态</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {state.status === 'success' ? `${state.data.length} 个应用` : '实时同步'}
              </p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers3 className="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </section>

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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {apps.map((app) => (
        <Link
          key={app.id}
          to={`/apps/${encodeURIComponent(app.id)}`}
          className="group rounded-lg border border-border bg-card/80 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Package className="size-5" aria-hidden="true" />
            </span>
            <StatusBadge active={app.isActive} />
          </div>
          <div className="mt-5 space-y-3">
            <h2 className="line-clamp-2 text-xl font-semibold tracking-tight">{app.name}</h2>
            <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
              {app.description || '这个应用暂未填写描述。'}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-sm font-medium">
            <span className="text-muted-foreground">查看详情</span>
            <ChevronRight className="size-4 text-primary transition group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="size-11 animate-pulse rounded-lg bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-6 h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
