import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Box, ChevronRight, CircleAlert, ArrowRight, Search } from 'lucide-react'
import { getApps } from '@/services'
import type { AppDto } from '@/types'
import { type LoadState, StatePanel } from './pageComponents'
import { getErrorMessage } from './pageUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function HomePage() {
  const [state, setState] = useState<LoadState<AppDto[]>>({ status: 'loading' })
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredApps = useMemo(() => {
    if (state.status !== 'success') return []
    return state.data.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [state, searchQuery])

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Showcase Section */}
      <section className="relative flex flex-col items-center text-center pt-12">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-6 px-4">
          <h1 className="max-w-4xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
            探索无限可能<br />
            <span className="bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent italic">分享每一个精彩应用</span>
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            更加便捷的应用分发方式，支持多平台安装和版本管理，让应用触手可及。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 rounded-full px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all" asChild>
              <a href="#apps">
                立即探索
                <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* App List Section */}
      <section id="apps" className="space-y-10 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">浏览应用库</h2>
            <p className="text-muted-foreground">
              发现更多优质应用，查看版本更新日志与安装渠道。
            </p>
          </div>
          
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="搜索应用..." 
              className="pl-10 h-11 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
          {state.status === 'success' && (
            filteredApps.length > 0 ? (
              <AppGrid apps={filteredApps} />
            ) : (
              <StatePanel
                icon={<Search className="size-5" />}
                title="未找到匹配应用"
                description={`没有找到名称或描述包含 "${searchQuery}" 的应用。`}
              />
            )
          )}
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
          className="block group"
        >
          <Card className="h-full rounded-[1.5rem] overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
            <CardContent className="p-6 space-y-3">
              <CardTitle className="text-2xl font-bold">{app.name}</CardTitle>
              <CardDescription className="line-clamp-3 text-base leading-relaxed h-18">
                {app.description || '探索这个应用的无限可能。'}
              </CardDescription>
            </CardContent>
            <CardFooter className="p-6 pt-0 border-t border-border/10 mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">了解详情</span>
              <div className="size-8 flex items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <ChevronRight className="size-4" />
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="h-full rounded-[1.5rem] border-border/50 bg-card/30">
          <CardHeader className="p-6 pb-0 flex-row items-start justify-between space-y-0">
            <div className="size-14 animate-pulse rounded-2xl bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0 mt-4 flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="size-8 animate-pulse rounded-full bg-muted" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
