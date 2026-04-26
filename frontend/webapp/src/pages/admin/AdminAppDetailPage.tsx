import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  BookText,
  Boxes,
  Download,
  FileArchive,
  GitBranch,
  LoaderCircle,
  Plus,
  SearchX,
  Upload,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createProtocol, createRelease, getApp, getChannelList, resolveApiUrl, uploadSoftPackage } from '@/services'
import type { AppDetailDto, ChannelDto, ProtocolDto, ReleaseDto, SoftDto } from '@/types'
import { StatePanel, StatusBadge, type LoadState } from '../pageComponents'
import {
  AdminPageHeader,
  AdminPanel,
  InlineMessage,
  SelectField,
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

interface NewSoftForm {
  name: string
  description: string
  releaseId: string
  channelId: string
  file: File | null
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

const emptySoftForm: NewSoftForm = {
  name: '',
  description: '',
  releaseId: '',
  channelId: '',
  file: null,
}

export function AdminAppDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [state, setState] = useState<LoadState<AppDetailDto>>({ status: 'loading' })
  const [channels, setChannels] = useState<ChannelDto[]>([])
  const [releaseForm, setReleaseForm] = useState<NewReleaseForm>(emptyReleaseForm)
  const [protocolForm, setProtocolForm] = useState<NewProtocolForm>(emptyProtocolForm)
  const [softForm, setSoftForm] = useState<NewSoftForm>(emptySoftForm)
  const [releaseError, setReleaseError] = useState('')
  const [protocolError, setProtocolError] = useState('')
  const [softError, setSoftError] = useState('')
  const [releaseSuccess, setReleaseSuccess] = useState('')
  const [protocolSuccess, setProtocolSuccess] = useState('')
  const [softSuccess, setSoftSuccess] = useState('')
  const [releaseSubmitting, setReleaseSubmitting] = useState(false)
  const [protocolSubmitting, setProtocolSubmitting] = useState(false)
  const [softSubmitting, setSoftSubmitting] = useState(false)

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
        const [app, nextChannels] = await Promise.all([getApp(appId), getChannelList()])
        if (ignore) return
        setState({ status: 'success', data: app })
        setChannels(nextChannels)
        setSoftForm((current) => ({
          ...current,
          releaseId: current.releaseId || app.releases[0]?.id || '',
          channelId: current.channelId || nextChannels[0]?.id || '',
        }))
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
      setSoftForm((current) => ({ ...current, releaseId: current.releaseId || createdRelease.id }))
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

  async function handleUploadSoft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !id) return

    const validationMessage = validateSoftForm(softForm)
    if (validationMessage) {
      setSoftError(validationMessage)
      setSoftSuccess('')
      return
    }

    setSoftSubmitting(true)
    setSoftError('')
    setSoftSuccess('')

    try {
      const uploadedSoft = await uploadSoftPackage(
        {
          name: softForm.name.trim(),
          description: softForm.description.trim(),
          releaseId: softForm.releaseId,
          channelId: softForm.channelId,
          file: softForm.file as File,
        },
        token,
      )
      setSoftForm((current) => ({
        ...emptySoftForm,
        releaseId: current.releaseId,
        channelId: current.channelId,
      }))
      setSoftSuccess(`已上传安装包 ${uploadedSoft.name}。`)
      await refreshCurrentApp(id)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setSoftError(getAdminErrorMessage(error))
    } finally {
      setSoftSubmitting(false)
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

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="状态" value={app.isActive ? '启用' : '停用'} />
        <MetricCard label="发行版" value={String(app.releases.length)} />
        <MetricCard label="安装包" value={String(countSofts(app.releases))} />
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

        <div className="space-y-6">
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

          <AdminPanel title="上传安装包" description="选择发行版和渠道后上传实体软件文件。" icon={<Upload className="size-5" />}>
            <form className="space-y-4" onSubmit={handleUploadSoft}>
              <TextField
                id="soft-name"
                label="安装包名称"
                value={softForm.name}
                autoComplete="off"
                placeholder="例如 Windows 安装包"
                onChange={(value) => setSoftForm((current) => ({ ...current, name: value }))}
              />
              <SelectField
                id="soft-release"
                label="所属发行版"
                value={softForm.releaseId}
                onChange={(value) => setSoftForm((current) => ({ ...current, releaseId: value }))}
              >
                <option value="">请选择发行版</option>
                {app.releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.name} / {release.releaseId}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="soft-channel"
                label="发布渠道"
                value={softForm.channelId}
                onChange={(value) => setSoftForm((current) => ({ ...current, channelId: value }))}
              >
                <option value="">请选择渠道</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </SelectField>
              <FileField
                id="soft-file"
                label="安装包文件"
                file={softForm.file}
                onChange={(file) => setSoftForm((current) => ({ ...current, file }))}
              />
              <TextAreaField
                id="soft-description"
                label="描述"
                value={softForm.description}
                placeholder="输入安装包说明"
                rows={3}
                onChange={(value) => setSoftForm((current) => ({ ...current, description: value }))}
              />

              {softError ? <InlineMessage tone="error" message={softError} /> : null}
              {softSuccess ? <InlineMessage tone="success" message={softSuccess} /> : null}

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full rounded-xl shadow-apple-md"
                disabled={softSubmitting}
              >
                {softSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {softSubmitting ? '正在上传' : '上传安装包'}
              </Button>
            </form>
          </AdminPanel>
        </div>
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
    <TableShell minWidth={900}>
      <thead className="bg-secondary/60 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">名称</th>
          <th className="px-4 py-3">版本号</th>
          <th className="px-4 py-3">发布日期</th>
          <th className="px-4 py-3">描述</th>
          <th className="px-4 py-3">安装包</th>
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
            <td className="px-4 py-3">
              <SoftList softs={release.softs} />
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function SoftList({ softs }: { softs: SoftDto[] }) {
  if (softs.length === 0) {
    return <span className="text-muted-foreground">暂无安装包</span>
  }

  return (
    <div className="space-y-2">
      {softs.map((soft) => (
        <div key={soft.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{soft.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {soft.channel?.name ?? '未设置渠道'}
              {soft.description ? ` · ${soft.description}` : ''}
            </p>
          </div>
          <Button asChild variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg" title="下载安装包">
            <a href={resolveApiUrl(soft.softUrl)} target="_blank" rel="noreferrer">
              <Download className="size-4" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  )
}

function FileField({
  id,
  label,
  file,
  onChange,
}: {
  id: string
  label: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background/80 px-4 py-4 text-center text-sm transition hover:border-ring hover:bg-secondary/50"
      >
        <FileArchive className="size-5 text-primary" />
        <span className="max-w-full truncate text-foreground">{file ? file.name : '点击选择安装包文件'}</span>
        {file ? <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span> : null}
      </label>
      <input
        id={id}
        type="file"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
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

function countSofts(releases: ReleaseDto[]) {
  return releases.reduce((total, release) => total + release.softs.length, 0)
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
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

function validateSoftForm(form: NewSoftForm) {
  if (!form.name.trim()) {
    return '请输入安装包名称。'
  }

  if (!form.releaseId) {
    return '请选择所属发行版。'
  }

  if (!form.channelId) {
    return '请选择发布渠道。'
  }

  if (!form.file) {
    return '请选择要上传的安装包文件。'
  }

  return ''
}

function isNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404
}
