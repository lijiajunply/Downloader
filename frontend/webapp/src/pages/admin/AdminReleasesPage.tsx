import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Boxes, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getReleaseList } from '@/services'
import type { ReleaseDto } from '@/types'
import type { LoadState } from '../pageComponents'
import { AdminPageHeader, AdminPanel, ResourceContent, TableShell } from './AdminShared'
import { asLoadState, formatDate, getAdminErrorMessage } from './adminUtils'

export function AdminReleasesPage() {
  const [state, setState] = useState<LoadState<ReleaseDto[]>>({ status: 'loading' })

  const loadReleases = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      const releases = await getReleaseList()
      setState(asLoadState(releases))
    } catch (error) {
      setState({ status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadInitialReleases() {
      try {
        const releases = await getReleaseList()
        if (ignore) return
        setState(asLoadState(releases))
      } catch (error) {
        if (ignore) return
        setState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }

    void loadInitialReleases()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={
          <>
            <GitBranch className="size-3.5" />
            Releases
          </>
        }
        title="发行版索引"
        description="全局查看发行版。新增发行版需要进入具体应用详情页完成。"
        action={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/apps">
                <Boxes className="size-4" />
                进入应用
              </Link>
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => void loadReleases()}>
              刷新
            </Button>
          </>
        }
      />

      <AdminPanel title="发行版列表" description="后端列表 DTO 不包含所属应用。" icon={<GitBranch className="size-5" />}>
        <ResourceContent
          state={state}
          emptyTitle="暂无发行版"
          emptyDescription="进入应用详情页可以添加发行版。"
          errorTitle="发行版加载失败"
        >
          {(releases) => <ReleaseTable releases={releases} />}
        </ResourceContent>
      </AdminPanel>
    </div>
  )
}

function ReleaseTable({ releases }: { releases: ReleaseDto[] }) {
  return (
    <TableShell minWidth={720}>
      <thead className="bg-secondary/60 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">名称</th>
          <th className="px-4 py-3">版本号</th>
          <th className="px-4 py-3">发布日期</th>
          <th className="px-4 py-3">描述</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {releases.map((release) => (
          <tr key={release.id} className="bg-background/40">
            <td className="px-4 py-3 font-medium text-foreground">{release.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{release.releaseId}</td>
            <td className="px-4 py-3 text-muted-foreground">{formatDate(release.releaseDate)}</td>
            <td className="max-w-sm px-4 py-3 text-muted-foreground">
              <span className="line-clamp-2">{release.description || '暂无描述'}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}
