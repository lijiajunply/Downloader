import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Box, ChevronRight, CircleAlert, Package, ArrowRight } from 'lucide-react'
import { getApps } from '@/services'
import type { AppDto } from '@/types'
import { type LoadState, StatePanel, StatusBadge } from './pageComponents'
import { getErrorMessage } from './pageUtils'
import { Button } from '@/components/ui/button'

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
    <div className="space-y-24 sm:space-y-32">
      {/* Hero Showcase Section */}
      <section className="relative flex flex-col items-center text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="max-w-4xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
            更优雅地分发<br />
            <span className="bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">您的所有应用</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            提供简约、高效的应用管理与分发平台。基于 Apple 设计哲学，为您的软件提供最完美的呈现方式。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 rounded-full px-8 text-base font-medium shadow-apple-md">
              开始探索
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base font-medium bg-card/50 backdrop-blur-sm border-border/60">
              了解更多
            </Button>
          </div>
        </div>
      </section>

      {/* App List Section */}
      <section id="apps" className="space-y-12 pb-24">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">浏览应用库</h2>
          <p className="max-w-2xl text-muted-foreground">
            发现更多优质应用，查看版本更新日志与安装渠道。
          </p>
        </div>

        <div>
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
        </div>
      </section>
    </div>
  )
}

function AppGrid({ apps }: { apps: AppDto[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <Link
          key={app.id}
          to={`/apps/${encodeURIComponent(app.id)}`}
          className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-apple-sm transition-all duration-500 hover:-translate-y-2 hover:border-primary/20 hover:shadow-apple-lg hover:bg-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-apple-sm transition-transform duration-500 group-hover:scale-110">
              <Package className="size-7" aria-hidden="true" />
            </div>
            <StatusBadge active={app.isActive} />
          </div>
          <div className="mt-8 flex-1 space-y-3">
            <h3 className="text-2xl font-bold tracking-tight">{app.name}</h3>
            <p className="line-clamp-3 text-base leading-relaxed text-muted-foreground">
              {app.description || '探索这个应用的无限可能。'}
            </p>
          </div>
          <div className="mt-10 flex items-center justify-between border-t border-border/40 pt-6">
            <span className="text-sm font-semibold tracking-wide text-primary">立即获取</span>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <ChevronRight className="size-4" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="rounded-[2rem] border border-border/60 bg-card/60 p-8 shadow-apple-sm"
        >
          <div className="flex items-center justify-between">
            <div className="size-14 animate-pulse rounded-2xl bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-10 h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="mt-4 space-y-3">
            <div className="h-4 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="mt-10 h-px bg-border/40" />
          <div className="mt-6 h-5 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}
