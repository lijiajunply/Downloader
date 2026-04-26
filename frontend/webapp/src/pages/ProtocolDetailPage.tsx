import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  CircleAlert,
  FileText,
  SearchX,
  ShieldCheck,
  Calendar,
  Share,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProtocol } from '@/services/protocolService'
import type { ProtocolDto } from '@/types'
import {
  type LoadState,
  StatePanel,
} from './pageComponents'
import { getErrorMessage } from './pageUtils'
import { Separator } from '@/components/ui/separator'
import ReactMarkdown from 'react-markdown'

export function ProtocolDetailPage() {
  const { protocolId } = useParams()
  const [state, setState] = useState<LoadState<ProtocolDto>>({ status: 'loading' })

  useEffect(() => {
    let ignore = false

    async function loadProtocol(id: string) {
      setState({ status: 'loading' })

      try {
        const protocol = await getProtocol(id)
        if (ignore) return
        setState({ status: 'success', data: protocol })
      } catch (error) {
        if (ignore) return
        const message = getErrorMessage(error)
        setState({ status: 'error', message })
      }
    }

    if (protocolId) {
      void loadProtocol(protocolId)
    }

    return () => {
      ignore = true
    }
  }, [protocolId])

  if (!protocolId) {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="没有找到这个协议"
        description="请返回上一页，从应用详情中重新选择。"
        action={<BackButton />}
      />
    )
  }

  if (state.status === 'loading') {
    return <ProtocolSkeleton />
  }

  if (state.status === 'error') {
    return (
      <StatePanel
        icon={<CircleAlert className="size-5" />}
        title="协议加载失败"
        description={state.message}
        action={<BackButton />}
      />
    )
  }

  if (state.status === 'success') {
    return <ProtocolDetail protocol={state.data} />
  }

  return null
}

function ProtocolDetail({ protocol }: { protocol: ProtocolDto }) {
  return (
    <div className="max-w-5xl mx-auto pb-4 space-y-8 sm:pb-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {protocol.name}
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            <span>生效日期: 2026年4月26日</span>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Content */}
      <section className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-muted/20 rounded-3xl p-6 sm:p-10 border border-border/10">
        <ReactMarkdown
          components={{
            h1: ({ ...props }) => <h1 className="text-xl font-bold mt-6 mb-4" {...props} />,
            h2: ({ ...props }) => <h2 className="text-lg font-bold mt-6 mb-3" {...props} />,
            h3: ({ ...props }) => <h3 className="text-base font-bold mt-4 mb-2" {...props} />,
            p: ({ ...props }) => <p className="text-sm leading-relaxed text-muted-foreground mb-4" {...props} />,
            ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
            li: ({ ...props }) => <li className="text-sm text-muted-foreground" {...props} />,
          }}
        >
          {protocol.context}
        </ReactMarkdown>
      </section>

      {/* Footer */}
      <section className="pt-8 text-center space-y-4">
        <p className="text-xs text-muted-foreground/60">
          如果您对本协议有任何疑问，请联系我们的支持团队。
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="sm" className="rounded-full px-6">
            联系我们
          </Button>
        </div>
      </section>
    </div>
  )
}

function ProtocolSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10 animate-pulse">
      <div className="h-10 w-24 bg-muted rounded-full" />
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-muted rounded-2xl" />
          <div className="h-10 w-2/3 bg-muted rounded-lg" />
        </div>
        <div className="h-4 w-1/3 bg-muted rounded" />
      </div>
      <div className="h-px bg-muted" />
      <div className="h-64 bg-muted/20 rounded-3xl" />
    </div>
  )
}

function BackButton() {
  return (
    <Button variant="ghost" size="sm" className="rounded-full gap-2 text-primary" onClick={() => window.history.back()}>
      <ArrowLeft className="size-4" />
      返回
    </Button>
  )
}
