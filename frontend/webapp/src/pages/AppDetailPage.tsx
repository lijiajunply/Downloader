import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowDownToLine,
  ArrowLeft,
  CircleAlert,
  FileText,
  Package,
  SearchX,
  ChevronRight,
  Info,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getApp, resolveApiUrl } from '@/services'
import type { AppDetailDto } from '@/types'
import {
  type LoadState,
  SoftEmptyState,
  StatePanel,
} from './pageComponents'
import { getErrorMessage } from './pageUtils'
import { CourseAppShowcase } from './showcase/CourseAppShowcase'
import { CampusMarketShowcase } from './showcase/CampusMarketShowcase'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function AppDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState<LoadState<AppDetailDto>>({ status: 'loading' })

  useEffect(() => {
    let ignore = false

    async function loadAppDetail(appId: string) {
      setState({ status: 'loading' })

      try {
        const app = await getApp(appId)
        if (ignore) return
        setState({ status: 'success', data: app })
      } catch (error) {
        if (ignore) return
        const message = getErrorMessage(error)
        setState(isNotFoundError(error) ? { status: 'not-found' } : { status: 'error', message })
      }
    }

    if (id) {
      void loadAppDetail(id)
    }

    return () => {
      ignore = true
    }
  }, [id])

  if (!id) {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="没有找到这个应用"
        description="请返回首页，从应用列表中重新选择。"
        action={<BackHomeButton />}
      />
    )
  }

  if (state.status === 'loading') {
    return <DetailSkeleton />
  }

  if (state.status === 'not-found') {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="没有找到这个应用"
        description="请返回首页，从应用列表中重新选择。"
        action={<BackHomeButton />}
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StatePanel
        icon={<CircleAlert className="size-5" />}
        title="详情加载失败"
        description={state.message}
        action={<BackHomeButton />}
      />
    )
  }

  if (state.status === 'empty') {
    return null
  }

  // Handle specialized showcase pages
  if (state.data.name === '课刻') {
    return <CourseAppShowcase app={state.data} />
  }

  if (state.data.name === ' MarketOurs') {
    return <CampusMarketShowcase app={state.data} />
  }

  return <AppDetail app={state.data} />
}

function AppDetail({ app }: { app: AppDetailDto }) {
  const latestRelease = useMemo(() => {
    if (app.releases.length === 0) return null
    return [...app.releases].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0]
  }, [app.releases])

  const sortedReleases = useMemo(() => {
    return [...app.releases].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
  }, [app.releases])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 sm:py-12">
      {/* Header Section */}
      <section className="flex gap-5 sm:gap-8 items-start">
        <div className="shrink-0">
          <div className="size-24 sm:size-32 lg:size-40 flex items-center justify-center rounded-[22%] bg-linear-to-br from-primary/10 to-primary/5 border border-border/40 shadow-xl overflow-hidden">
             <Package className="size-1/2 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 py-1 flex flex-col h-24 sm:h-32 lg:h-40 justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate">
              {app.name}
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground font-medium truncate opacity-70">
              高效实用的工具应用
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button size="sm" className="rounded-full h-8 sm:h-9 px-6 sm:px-8 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 shadow-sm" asChild={!!latestRelease}>
                {latestRelease ? (
                  <a href="#releases">获取</a>
                ) : (
                  <span>暂无版本</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ratings/Info Row */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-0 no-scrollbar sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
        <div className="flex flex-col items-center justify-center min-w-24 border-r border-border/50 px-2 last:border-0 sm:border-r">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">版本数量</span>
          <span className="text-xl font-bold mt-0.5">{app.releases.length}</span>
          <span className="text-[10px] text-muted-foreground">已发布</span>
        </div>
        <div className="flex flex-col items-center justify-center min-w-24 border-r border-border/50 px-2 last:border-0 sm:border-r">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">最新版本</span>
          <span className="text-xl font-bold mt-0.5">{latestRelease?.releaseId || '--'}</span>
          <span className="text-[10px] text-muted-foreground">{latestRelease ? formatDate(latestRelease.releaseDate) : '暂无'}</span>
        </div>
        <div className="flex flex-col items-center justify-center min-w-24 border-r border-border/50 px-2 last:border-0 sm:border-r">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">隐私说明</span>
          <span className="text-xl font-bold mt-0.5 flex items-center gap-1">
            <ShieldCheck className="size-5" />
          </span>
          <span className="text-[10px] text-muted-foreground">{app.protocols.length} 项协议</span>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Description */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">简介</h2>
        <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
          {app.description || '探索这个应用的无限可能。这是一款专为提高生产力和协作而设计的强大工具，能够帮助您在多平台间无缝同步您的工作流程。'}
        </p>
      </section>

      {/* Releases Section */}
      <section id="releases" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">发行版本</h2>
          <Button variant="link" className="text-sm h-auto p-0 text-primary">查看全部</Button>
        </div>
        
        <div className="space-y-3">
          {sortedReleases.map((release, index) => (
            <Collapsible key={release.id} defaultOpen={index === 0}>
              <div className="rounded-2xl bg-muted/30 overflow-hidden border border-border/10">
                <CollapsibleTrigger className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base sm:text-lg truncate">{release.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono h-5">{release.releaseId}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3" />
                      {formatDate(release.releaseDate)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground group-data-[state=open]:rotate-90 transition-transform" />
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-4">
                    {release.description && (
                      <p className="text-sm text-muted-foreground border-t border-border/10 pt-4 leading-relaxed">
                        {release.description}
                      </p>
                    )}
                    
                    <div className="grid gap-2 sm:grid-cols-2">
                      {release.softs.map((soft) => (
                        <div key={soft.id} className="flex items-center justify-between gap-3 bg-background/60 rounded-xl p-3 border border-border/30">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{soft.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{soft.channel?.name ?? '通用渠道'}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="size-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                            <a href={resolveApiUrl(soft.softUrl)} target="_blank" rel="noreferrer">
                              <ArrowDownToLine className="size-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                      {release.softs.length === 0 && (
                        <p className="text-xs text-muted-foreground italic col-span-full py-2">该版本暂未上传软件包。</p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
          {app.releases.length === 0 && (
             <SoftEmptyState title="暂无发行版" description="这个应用还没有发布任何发行版。" />
          )}
        </div>
      </section>

      {/* Protocols Section */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">App 协议</h2>
        <div className="rounded-3xl bg-muted/30 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-1">
            <div className="divide-y divide-border/10">
              {app.protocols.map((protocol) => (
                <div key={protocol.id} className="py-4 flex items-start gap-3 group">
                  <div className="size-9 shrink-0 flex items-center justify-center rounded-xl bg-background shadow-xs">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{protocol.name}</p>
                      <Link to="#" className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        查看条款
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {protocol.description || '此协议规定了软件的使用权限、用户的权利与义务以及隐私保护相关事宜。'}
                    </p>
                    {protocol.context && (
                      <div className="mt-2 bg-background/40 rounded-lg p-2.5 border border-border/5">
                        <p className="text-[10px] text-muted-foreground font-mono leading-tight truncate">
                          ID: {protocol.id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {app.protocols.length === 0 && (
                <div className="flex items-center gap-3 py-4">
                   <Info className="size-5 text-muted-foreground" />
                   <p className="text-sm text-muted-foreground italic">开发者尚未提供详细的协议说明。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 animate-pulse">
      <div className="flex gap-8 items-start">
        <div className="size-32 sm:size-40 bg-muted rounded-[22%]" />
        <div className="flex-1 space-y-4 py-2">
          <div className="h-10 w-2/3 bg-muted rounded-lg" />
          <div className="h-5 w-1/3 bg-muted rounded-md" />
          <div className="h-9 w-28 bg-muted rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/40 rounded-xl" />
        ))}
      </div>
      <div className="h-px bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-1/4 bg-muted rounded" />
        <div className="h-20 bg-muted/20 rounded-2xl" />
      </div>
    </div>
  )
}

function BackHomeButton() {
  return (
    <Button asChild>
      <Link to="/">
        <ArrowLeft className="size-4" aria-hidden="true" />
        返回首页
      </Link>
    </Button>
  )
}

function isNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value || '未知日期'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
