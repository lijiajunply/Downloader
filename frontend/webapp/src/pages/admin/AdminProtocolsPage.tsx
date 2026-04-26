import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BookText, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProtocolList } from '@/services'
import type { ProtocolDto } from '@/types'
import type { LoadState } from '../pageComponents'
import { AdminPageHeader, AdminPanel, ResourceContent, TableShell } from './AdminShared'
import { asLoadState, getAdminErrorMessage, truncateText } from './adminUtils'

export function AdminProtocolsPage() {
  const [state, setState] = useState<LoadState<ProtocolDto[]>>({ status: 'loading' })

  const loadProtocols = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      const protocols = await getProtocolList()
      setState(asLoadState(protocols))
    } catch (error) {
      setState({ status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadInitialProtocols() {
      try {
        const protocols = await getProtocolList()
        if (ignore) return
        setState(asLoadState(protocols))
      } catch (error) {
        if (ignore) return
        setState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }

    void loadInitialProtocols()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={
          <>
            <BookText className="size-3.5" />
            Protocols
          </>
        }
        title="协议索引"
        description="全局查看协议。新增协议需要进入具体应用详情页完成。"
        action={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/apps">
                <Boxes className="size-4" />
                进入应用
              </Link>
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => void loadProtocols()}>
              刷新
            </Button>
          </>
        }
      />

      <AdminPanel title="协议列表" description="后端列表 DTO 不包含所属应用。" icon={<BookText className="size-5" />}>
        <ResourceContent
          state={state}
          emptyTitle="暂无协议"
          emptyDescription="进入应用详情页可以添加协议。"
          errorTitle="协议加载失败"
        >
          {(protocols) => <ProtocolTable protocols={protocols} />}
        </ResourceContent>
      </AdminPanel>
    </div>
  )
}

function ProtocolTable({ protocols }: { protocols: ProtocolDto[] }) {
  return (
    <TableShell minWidth={760}>
      <thead className="bg-secondary/60 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">名称</th>
          <th className="px-4 py-3">描述</th>
          <th className="px-4 py-3">正文预览</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {protocols.map((protocol) => (
          <tr key={protocol.id} className="bg-background/40">
            <td className="px-4 py-3 font-medium text-foreground">{protocol.name}</td>
            <td className="max-w-xs px-4 py-3 text-muted-foreground">
              <span className="line-clamp-2">{protocol.description || '暂无描述'}</span>
            </td>
            <td className="max-w-md px-4 py-3 text-muted-foreground">
              <span className="line-clamp-2">{truncateText(protocol.context || '暂无正文')}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}
