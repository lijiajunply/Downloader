import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  BookText,
  Boxes,
  GitBranch,
  LoaderCircle,
  Plus,
  SearchX,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createProtocol, createRelease, getApp } from '@/services'
import type { AppDetailDto, ProtocolDto, ReleaseDto } from '@/types'
import { StatePanel, StatusBadge, type LoadState } from '../pageComponents'
import {
  AdminPageHeader,
  AdminPanel,
  InlineMessage,
  TableShell,
  TextAreaField,
  TextField,
} from './AdminShared'
import { formatDate, getAdminErrorMessage, truncateText } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'

interface NewReleaseForm {
  name: string
  description: string
  releaseId: string
}

interface NewProtocolForm {
  name: string
  description: string
  context: string
}

const emptyReleaseForm: NewReleaseForm = {
  name: '',
  description: '',
  releaseId: '',
}

const emptyProtocolForm: NewProtocolForm = {
  name: '',
  description: '',
  context: '',
}

export function AdminAppDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [state, setState] = useState<LoadState<AppDetailDto>>({ status: 'loading' })
  const [releaseForm, setReleaseForm] = useState<NewReleaseForm>(emptyReleaseForm)
  const [protocolForm, setProtocolForm] = useState<NewProtocolForm>(emptyProtocolForm)
  const [releaseError, setReleaseError] = useState('')
  const [protocolError, setProtocolError] = useState('')
  const [releaseSuccess, setReleaseSuccess] = useState('')
  const [protocolSuccess, setProtocolSuccess] = useState('')
  const [releaseSubmitting, setReleaseSubmitting] = useState(false)
  const [protocolSubmitting, setProtocolSubmitting] = useState(false)

  const loadAppDetail = useCallback(async () => {
    if (!id) return

    setState({ status: 'loading' })

    try {
      const app = await getApp(id)
      setState({ status: 'success', data: app })
    } catch (error) {
      setState(isNotFoundError(error) ? { status: 'not-found' } : { status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    let ignore = false

    async function loadInitialApp(appId: string) {
      try {
        const app = await getApp(appId)
        if (ignore) return
        setState({ status: 'success', data: app })
      } catch (error) {
        if (ignore) return
        setState(isNotFoundError(error) ? { status: 'not-found' } : { status: 'error', message: getAdminErrorMessage(error) })
      }
    }

    void loadInitialApp(id)

    return () => {
      ignore = true
    }
  }, [id])

  async function handleCreateRelease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !id) return

    const validationMessage = validateReleaseForm(releaseForm)
    if (validationMessage) {
      setReleaseError(validationMessage)
      setReleaseSuccess('')
      return
    }

    setReleaseSubmitting(true)
    setReleaseError('')
    setReleaseSuccess('')

    try {
      const createdRelease = await createRelease(
        {
          name: releaseForm.name.trim(),
          description: releaseForm.description.trim(),
          releaseId: releaseForm.releaseId.trim(),
          appId: id,
        },
        token,
      )
      setReleaseForm(emptyReleaseForm)
      setReleaseSuccess(`已添加发行版 ${createdRelease.name}。`)
      await refreshCurrentApp(id)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setReleaseError(getAdminErrorMessage(error))
    } finally {
      setReleaseSubmitting(false)
    }
  }

  async function handleCreateProtocol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !id) return

    const validationMessage = validateProtocolForm(protocolForm)
    if (validationMessage) {
      setProtocolError(validationMessage)
      setProtocolSuccess('')
      return
    }

    setProtocolSubmitting(true)
    setProtocolError('')
    setProtocolSuccess('')

    try {
      const createdProtocol = await createProtocol(
        {
          name: protocolForm.name.trim(),
          description: protocolForm.description.trim(),
          context: protocolForm.context.trim(),
          appId: id,
        },
        token,
      )
      setProtocolForm(emptyProtocolForm)
      setProtocolSuccess(`已添加协议 ${createdProtocol.name}。`)
      await refreshCurrentApp(id)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setProtocolError(getAdminErrorMessage(error))
    } finally {
      setProtocolSubmitting(false)
    }
  }

  async function refreshCurrentApp(appId: string) {
    const app = await getApp(appId)
    setState({ status: 'success', data: app })
  }

  if (!id) {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="没有找到这个应用"
        description="请返回应用列表重新选择。"
        action={<BackToAppsButton />}
      />
    )
  }

  if (state.status === 'loading') {
    return <AppDetailSkeleton />
  }

  if (state.status === 'not-found') {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="没有找到这个应用"
        description="请返回应用列表重新选择。"
        action={<BackToAppsButton />}
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="应用详情加载失败"
        description={state.message}
        action={<BackToAppsButton />}
      />
    )
  }

  if (state.status === 'empty') {
    return null
  }

  const app = state.data

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={
          <>
            <Boxes className="size-3.5" />
            App Detail
          </>
        }
        title={app.name}
        description={app.description || '这个应用暂未填写描述。'}
        action={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/apps">
                <ArrowLeft className="size-4" />
                返回应用
              </Link>
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => void loadAppDetail()}>
              刷新
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="状态" value={app.isActive ? '启用' : '停用'} />
        <MetricCard label="发行版" value={String(app.releases.length)} />
        <MetricCard label="协议" value={String(app.protocols.length)} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <AdminPanel
          title="发行版"
          description="当前应用下的发行版，发布日期由后端生成。"
          icon={<GitBranch className="size-5" />}
        >
          {app.releases.length > 0 ? (
            <ReleaseTable releases={app.releases} />
          ) : (
            <StatePanel
              icon={<GitBranch className="size-5" />}
              title="暂无发行版"
              description="为这个应用添加第一个发行版。"
            />
          )}
        </AdminPanel>

        <AdminPanel title="添加发行版" icon={<Plus className="size-5" />}>
          <form className="space-y-4" onSubmit={handleCreateRelease}>
            <TextField
              id="release-name"
              label="发行版名称"
              value={releaseForm.name}
              autoComplete="off"
              placeholder="例如 Stable 1.0"
              onChange={(value) => setReleaseForm((current) => ({ ...current, name: value }))}
            />
            <TextField
              id="release-id"
              label="版本号"
              value={releaseForm.releaseId}
              autoComplete="off"
              placeholder="例如 1.0.0"
              onChange={(value) => setReleaseForm((current) => ({ ...current, releaseId: value }))}
            />
            <TextAreaField
              id="release-description"
              label="描述"
              value={releaseForm.description}
              placeholder="输入发行版说明"
              onChange={(value) => setReleaseForm((current) => ({ ...current, description: value }))}
            />

            {releaseError ? <InlineMessage tone="error" message={releaseError} /> : null}
            {releaseSuccess ? <InlineMessage tone="success" message={releaseSuccess} /> : null}

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl shadow-apple-md"
              disabled={releaseSubmitting}
            >
              {releaseSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {releaseSubmitting ? '正在添加' : '添加发行版'}
            </Button>
          </form>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <AdminPanel
          title="协议"
          description="当前应用下的协议和隐私说明。"
          icon={<BookText className="size-5" />}
        >
          {app.protocols.length > 0 ? (
            <ProtocolTable protocols={app.protocols} />
          ) : (
            <StatePanel
              icon={<BookText className="size-5" />}
              title="暂无协议"
              description="为这个应用添加协议或隐私说明。"
            />
          )}
        </AdminPanel>

        <AdminPanel title="添加协议" icon={<Plus className="size-5" />}>
          <form className="space-y-4" onSubmit={handleCreateProtocol}>
            <TextField
              id="protocol-name"
              label="协议名称"
              value={protocolForm.name}
              autoComplete="off"
              placeholder="例如 用户协议"
              onChange={(value) => setProtocolForm((current) => ({ ...current, name: value }))}
            />
            <TextAreaField
              id="protocol-description"
              label="描述"
              value={protocolForm.description}
              placeholder="输入协议描述"
              rows={3}
              onChange={(value) => setProtocolForm((current) => ({ ...current, description: value }))}
            />
            <TextAreaField
              id="protocol-context"
              label="协议正文"
              value={protocolForm.context}
              placeholder="输入协议正文"
              rows={8}
              onChange={(value) => setProtocolForm((current) => ({ ...current, context: value }))}
            />

            {protocolError ? <InlineMessage tone="error" message={protocolError} /> : null}
            {protocolSuccess ? <InlineMessage tone="success" message={protocolSuccess} /> : null}

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl shadow-apple-md"
              disabled={protocolSubmitting}
            >
              {protocolSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {protocolSubmitting ? '正在添加' : '添加协议'}
            </Button>
          </form>
        </AdminPanel>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="mt-4">
        {label === '状态' ? <StatusBadge active={value === '启用'} /> : <p className="text-3xl font-bold">{value}</p>}
      </div>
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

function ProtocolTable({ protocols }: { protocols: ProtocolDto[] }) {
  return (
    <TableShell minWidth={720}>
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

function AppDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-2xl border border-border/60 bg-card/60" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl border border-border/60 bg-card/60" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-border/60 bg-card/60" />
    </div>
  )
}

function BackToAppsButton() {
  return (
    <Button asChild>
      <Link to="/admin/apps">
        <ArrowLeft className="size-4" />
        返回应用
      </Link>
    </Button>
  )
}

function validateReleaseForm(form: NewReleaseForm) {
  if (!form.name.trim()) {
    return '请输入发行版名称。'
  }

  if (!form.releaseId.trim()) {
    return '请输入版本号。'
  }

  if (!form.description.trim()) {
    return '请输入发行版描述。'
  }

  return ''
}

function validateProtocolForm(form: NewProtocolForm) {
  if (!form.name.trim()) {
    return '请输入协议名称。'
  }

  if (!form.description.trim()) {
    return '请输入协议描述。'
  }

  if (!form.context.trim()) {
    return '请输入协议正文。'
  }

  return ''
}

function isNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404
}
