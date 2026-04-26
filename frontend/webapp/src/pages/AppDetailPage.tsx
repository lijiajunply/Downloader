import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowDownToLine,
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  FileText,
  Layers3,
  Package,
  RefreshCw,
  SearchX,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getApp } from '@/services'
import type { AppDetailDto, ProtocolDto, ReleaseDto, SoftDto } from '@/types'
import {
  type LoadState,
  SectionHeader,
  SoftEmptyState,
  StatePanel,
  StatusBadge,
} from './pageComponents'
import { getErrorMessage } from './pageUtils'
import { CourseAppShowcase } from './showcase/CourseAppShowcase'
import { CampusMarketShowcase } from './showcase/CampusMarketShowcase'

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
  const releaseCount = app.releases.length
  const softCount = useMemo(
    () => app.releases.reduce((count, release) => count + release.softs.length, 0),
    [app.releases],
  )
  const channels = useMemo(() => getUniqueChannels(app.releases), [app.releases])

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground/70 transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        返回首页
      </Link>

      {/* Hero Header */}
      <section className="relative -mt-6 flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
             <StatusBadge active={app.isActive} />
             <span className="rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
               {releaseCount} 个发行版
             </span>
          </div>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {app.name}
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {app.description || '探索这个应用的无限可能。'}
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
           <Button size="lg" className="rounded-full h-12 px-6 shadow-apple-md">
             立即获取
           </Button>
        </div>
      </section>

      {/* Metric cards - macOS Settings style */}
      <aside className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={<Layers3 className="size-5" />} label="发行版" value={releaseCount} />
        <MetricCard icon={<Package className="size-5" />} label="软件实体" value={softCount} />
        <MetricCard icon={<ShieldCheck className="size-5" />} label="渠道" value={channels.length} />
      </aside>

      {/* Releases + Protocols */}
      <div className="grid gap-12 xl:grid-cols-[1.4fr_0.6fr] xl:gap-16">
        <ReleaseSection releases={app.releases} />
        <ProtocolSection protocols={app.protocols} />
      </div>
    </div>
  )
}

function ReleaseSection({ releases }: { releases: ReleaseDto[] }) {
  return (
    <section className="space-y-5" aria-label="发行版">
      <SectionHeader
        icon={<RefreshCw className="size-4" />}
        title="发行版"
        description="每个发行版下的软件实体和渠道。"
      />
      {releases.length === 0 ? (
        <SoftEmptyState title="暂无发行版" description="这个应用还没有发布任何发行版。" />
      ) : (
        <div className="space-y-4">
          {releases.map((release) => (
            <article
              key={release.id}
              className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-apple-sm transition-all duration-200 hover:shadow-apple-md sm:p-7"
            >
              {/* Release header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">{release.name}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {release.description || '这个发行版暂未填写描述。'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-secondary/70 px-3 py-1 text-secondary-foreground shadow-apple-sm">
                    {release.releaseId}
                  </span>
                  <span className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                    {formatDate(release.releaseDate)}
                  </span>
                </div>
              </div>

              {/* Release body - softs grid */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {release.softs.length === 0 ? (
                  <div className="sm:col-span-2">
                    <SoftEmptyState
                      title="暂无软件实体"
                      description="这个发行版还没有可下载的软件实体。"
                    />
                  </div>
                ) : (
                  release.softs.map((soft) => <SoftCard key={soft.id} soft={soft} />)
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function SoftCard({ soft }: { soft: SoftDto }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-5 shadow-apple-sm transition-all duration-200 hover:border-border/80 hover:shadow-apple-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h4 className="line-clamp-2 font-semibold tracking-tight">{soft.name}</h4>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {soft.description || '这个软件实体暂未填写描述。'}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {soft.channel?.name ?? '未分配渠道'}
        </span>
      </div>
      <a
        href={soft.softUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-3.5 py-2 text-sm font-medium text-foreground shadow-apple-sm transition-all duration-200 hover:border-primary/30 hover:text-primary hover:shadow-apple-md"
      >
        <ArrowDownToLine className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">下载软件</span>
      </a>
    </div>
  )
}

function ProtocolSection({ protocols }: { protocols: ProtocolDto[] }) {
  return (
    <section className="space-y-5" aria-label="用户协议">
      <SectionHeader
        icon={<FileText className="size-4" />}
        title="用户协议"
        description="应用关联的协议、隐私政策或说明文档。"
      />
      {protocols.length === 0 ? (
        <SoftEmptyState title="暂无用户协议" description="这个应用还没有关联用户协议。" />
      ) : (
        <div className="space-y-3">
          {protocols.map((protocol) => (
            <details
              key={protocol.id}
              className="group rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm transition-all duration-200 open:shadow-apple-md sm:p-6"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <span className="block font-semibold tracking-tight">{protocol.name}</span>
                  <span className="line-clamp-2 block text-sm leading-6 text-muted-foreground">
                    {protocol.description || '这个协议暂未填写描述。'}
                  </span>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <div className="mt-5 max-h-96 overflow-auto rounded-xl bg-secondary/50 p-5 text-sm leading-7 text-secondary-foreground/90">
                <p className="whitespace-pre-wrap wrap-break-word">{protocol.context || '暂无协议正文。'}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-apple-sm transition-all duration-200 hover:shadow-apple-md">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-apple-sm">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-10 sm:space-y-12">
      <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
      <div className="h-52 animate-pulse rounded-2xl border border-border/60 bg-card/60 shadow-apple-sm" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card/60 shadow-apple-sm"
          />
        ))}
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

function getUniqueChannels(releases: ReleaseDto[]) {
  const channels = new Map<string, string>()

  for (const release of releases) {
    for (const soft of release.softs) {
      if (soft.channel) {
        channels.set(soft.channel.id, soft.channel.name)
      }
    }
  }

  return [...channels.values()]
}
