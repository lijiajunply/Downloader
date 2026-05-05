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
  RotateCcw,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  createRelease, 
  deleteSoft,
  getApp, 
  getChannelList, 
  resolveApiUrl, 
  uploadSoftPackage,
  updateSoft,
  updateRelease,
  deleteRelease,
  deleteProtocol
} from '@/services'
import type { AppDetailDto, ChannelDto, ProtocolDto, ReleaseDto, SoftDto } from '@/types'
import { StatePanel, StatusBadge, type LoadState } from '../pageComponents'
import {
  AdminPageHeader,
  AdminPanel,
  TableShell,
} from './AdminShared'
import { AppIcon } from '@/components/AppIcon'
import { formatDate, getAdminErrorMessage, truncateText } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NewReleaseForm {
  name: string
  description: string
  releaseId: string
}

interface NewSoftForm {
  name: string
  description: string
  releaseId: string
  channelId: string
  file: File | null
}

interface EditSoftForm {
  id: string
  name: string
  description: string
  releaseId: string
  channelId: string
  softUrl: string
}

const emptyReleaseForm: NewReleaseForm = {
  name: '',
  description: '',
  releaseId: '',
}

const emptySoftForm: NewSoftForm = {
  name: '',
  description: '',
  releaseId: '',
  channelId: '',
  file: null,
}

const emptyEditSoftForm: EditSoftForm = {
  id: '',
  name: '',
  description: '',
  releaseId: '',
  channelId: '',
  softUrl: '',
}

export function AdminAppDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [state, setState] = useState<LoadState<AppDetailDto>>({ status: 'loading' })
  const [channels, setChannels] = useState<ChannelDto[]>([])
  
  const [releaseForm, setReleaseForm] = useState<NewReleaseForm>(emptyReleaseForm)
  const [softForm, setSoftForm] = useState<NewSoftForm>(emptySoftForm)
  const [editingSoft, setEditingSoft] = useState<EditSoftForm>(emptyEditSoftForm)
  
  const [releaseError, setReleaseError] = useState('')
  const [softError, setSoftError] = useState('')
  const [softEditError, setSoftEditError] = useState('')
  
  const [releaseSubmitting, setReleaseSubmitting] = useState(false)
  const [softSubmitting, setSoftSubmitting] = useState(false)
  const [softEditSubmitting, setSoftEditSubmitting] = useState(false)
  
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [softDialogOpen, setSoftDialogOpen] = useState(false)
  const [softEditDialogOpen, setSoftEditDialogOpen] = useState(false)
  
  // For Editing/Deleting
  const [editingRelease, setEditingRelease] = useState<ReleaseDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'release' | 'protocol' | 'soft', id: string } | null>(null)

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
      return
    }

    setReleaseSubmitting(true)
    setReleaseError('')

    try {
      if (editingRelease) {
        await updateRelease(editingRelease.id, {
          name: releaseForm.name.trim(),
          description: releaseForm.description.trim(),
          releaseId: releaseForm.releaseId.trim(),
        }, token)
      } else {
        await createRelease({
          name: releaseForm.name.trim(),
          description: releaseForm.description.trim(),
          releaseId: releaseForm.releaseId.trim(),
          appId: id,
        }, token)
      }
      setReleaseForm(emptyReleaseForm)
      setEditingRelease(null)
      setReleaseDialogOpen(false)
      await refreshCurrentApp(id)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setReleaseError(getAdminErrorMessage(error))
    } finally {
      setReleaseSubmitting(false)
    }
  }

  async function handleUploadSoft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !id) return

    const validationMessage = validateSoftForm(softForm)
    if (validationMessage) {
      setSoftError(validationMessage)
      return
    }

    setSoftSubmitting(true)
    setSoftError('')

    try {
      await uploadSoftPackage({
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
      setSoftDialogOpen(false)
      await refreshCurrentApp(id)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setSoftError(getAdminErrorMessage(error))
    } finally {
      setSoftSubmitting(false)
    }
  }

  async function handleUpdateSoft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !id) return

    const validationMessage = validateSoftEditForm(editingSoft)
    if (validationMessage) {
      setSoftEditError(validationMessage)
      return
    }

    setSoftEditSubmitting(true)
    setSoftEditError('')

    try {
      await updateSoft(editingSoft.id, {
        name: editingSoft.name.trim(),
        description: editingSoft.description.trim(),
        softUrl: editingSoft.softUrl,
        releaseId: editingSoft.releaseId,
        channelId: editingSoft.channelId,
      }, token)
      setEditingSoft(emptyEditSoftForm)
      setSoftEditDialogOpen(false)
      await refreshCurrentApp(id)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setSoftEditError(getAdminErrorMessage(error))
    } finally {
      setSoftEditSubmitting(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!token || !deleteTarget || !id) return

    try {
      if (deleteTarget.type === 'release') {
        await deleteRelease(deleteTarget.id, token)
      } else if (deleteTarget.type === 'soft') {
        await deleteSoft(deleteTarget.id, token)
      } else {
        await deleteProtocol(deleteTarget.id, token)
      }
      await refreshCurrentApp(id)
    } catch (error) {
      if (handleAuthFailure(error)) return
      // We might want an error toast here
    } finally {
      setDeleteTarget(null)
    }
  }

  async function refreshCurrentApp(appId: string) {
    const app = await getApp(appId)
    setState({ status: 'success', data: app })
  }

  const openEditRelease = (release: ReleaseDto) => {
    setEditingRelease(release)
    setReleaseForm({
      name: release.name,
      description: release.description,
      releaseId: release.releaseId,
    })
    setReleaseDialogOpen(true)
  }

  const openEditSoft = (releaseId: string, soft: SoftDto) => {
    setEditingSoft({
      id: soft.id,
      name: soft.name,
      description: soft.description ?? '',
      releaseId,
      channelId: soft.channel?.id ?? '',
      softUrl: soft.softUrl,
    })
    setSoftEditError('')
    setSoftEditDialogOpen(true)
  }

  if (state.status === 'loading') return <AppDetailSkeleton />
  if (state.status === 'not-found' || !id) return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="没有找到这个应用"
        description="请返回应用列表重新选择。"
        action={<BackToAppsButton />}
      />
  )
  if (state.status === 'error') return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="应用详情加载失败"
        description={state.message}
        action={<BackToAppsButton />}
      />
  )

  const app = state.status === 'success' ? state.data : null
  if (!app) return null

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={<><Boxes className="size-3.5" /> App Detail</>}
        title={app.name}
        description={app.description || '这个应用暂未填写描述。'}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/admin/apps"><ArrowLeft className="size-4" /> 返回</Link></Button>
            <Button variant="outline" size="icon" onClick={() => void loadAppDetail()}><RotateCcw className="size-4" /></Button>
          </div>
        }
      />

      <section className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm">
        <AppIcon name={app.name} iconUrl={app.iconUrl} className="size-16" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{app.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {app.iconUrl ? '已配置应用图标' : '未配置应用图标'}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="状态" value={app.isActive ? '启用' : '停用'} />
        <MetricCard label="发行版" value={String(app.releases.length)} />
        <MetricCard label="安装包" value={String(countSofts(app.releases))} />
        <MetricCard label="协议" value={String(app.protocols.length)} />
      </section>

      <AdminPanel title="发行版管理" description="管理发行版本及安装包。" icon={<GitBranch className="size-5" />}>
        <div className="mb-4 flex justify-end gap-2">
           <Dialog open={releaseDialogOpen} onOpenChange={(val) => {
             setReleaseDialogOpen(val)
             if (!val) { setEditingRelease(null); setReleaseForm(emptyReleaseForm); setReleaseError(''); }
           }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="size-4" /> 添加发行版</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateRelease}>
                  <DialogHeader>
                    <DialogTitle>{editingRelease ? '编辑发行版' : '添加新发行版'}</DialogTitle>
                    <DialogDescription>填写发行版本的基本信息。</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="release-name">发行版名称</Label>
                      <Input id="release-name" placeholder="例如 Stable 1.0" value={releaseForm.name} onChange={(e) => setReleaseForm({ ...releaseForm, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="release-id">版本号</Label>
                      <Input id="release-id" placeholder="例如 1.0.0" value={releaseForm.releaseId} onChange={(e) => setReleaseForm({ ...releaseForm, releaseId: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="release-description">发行版描述</Label>
                      <Textarea id="release-description" placeholder="说明此版本的改进..." value={releaseForm.description} onChange={(e) => setReleaseForm({ ...releaseForm, description: e.target.value })} />
                    </div>
                    {releaseError && <p className="text-sm font-medium text-destructive">{releaseError}</p>}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={releaseSubmitting}>
                      {releaseSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                      {editingRelease ? '保存修改' : '确认添加'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={softDialogOpen}
              onOpenChange={(open) => {
                setSoftDialogOpen(open)
                if (!open) {
                  setSoftError('')
                  setSoftForm((current) => ({
                    ...emptySoftForm,
                    releaseId: current.releaseId,
                    channelId: current.channelId,
                  }))
                }
              }}
            >
              <DialogTrigger asChild><Button size="sm"><Upload className="size-4" /> 上传安装包</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleUploadSoft}>
                  <DialogHeader><DialogTitle>上传安装包</DialogTitle><DialogDescription>选择版本和渠道，并上传实体文件。</DialogDescription></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="soft-name">安装包名称</Label>
                      <Input id="soft-name" value={softForm.name} onChange={(e) => setSoftForm({ ...softForm, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="soft-release">所属发行版</Label>
                      <Select value={softForm.releaseId} onValueChange={(val) => setSoftForm({ ...softForm, releaseId: val })}>
                        <SelectTrigger id="soft-release"><SelectValue placeholder="选择发行版" /></SelectTrigger>
                        <SelectContent>{app.releases.map((r: ReleaseDto) => <SelectItem key={r.id} value={r.id}>{r.name} ({r.releaseId})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="soft-channel">发布渠道</Label>
                      <Select value={softForm.channelId} onValueChange={(val) => setSoftForm({ ...softForm, channelId: val })}>
                        <SelectTrigger id="soft-channel"><SelectValue placeholder="选择渠道" /></SelectTrigger>
                        <SelectContent>{channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="soft-file">文件</Label>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="soft-file" className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-muted/30 px-4 py-2 text-center text-xs hover:bg-muted/50">
                          <FileArchive className="size-4 text-primary" />
                          <span className="max-w-full truncate font-medium">{softForm.file ? softForm.file.name : '点击选择文件'}</span>
                        </label>
                        <input id="soft-file" type="file" className="sr-only" onChange={(e) => setSoftForm({ ...softForm, file: e.target.files?.[0] ?? null })} />
                      </div>
                    </div>
                    {softError && <p className="text-sm font-medium text-destructive">{softError}</p>}
                  </div>
                  <DialogFooter><Button type="submit" disabled={softSubmitting}>{softSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />} 确认上传</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={softEditDialogOpen}
              onOpenChange={(open) => {
                setSoftEditDialogOpen(open)
                if (!open) {
                  setEditingSoft(emptyEditSoftForm)
                  setSoftEditError('')
                }
              }}
            >
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleUpdateSoft}>
                  <DialogHeader>
                    <DialogTitle>编辑安装包</DialogTitle>
                    <DialogDescription>调整安装包名称、归属发行版和发布渠道。</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-soft-name">安装包名称</Label>
                      <Input
                        id="edit-soft-name"
                        value={editingSoft.name}
                        onChange={(e) => setEditingSoft({ ...editingSoft, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-soft-release">所属发行版</Label>
                      <Select
                        value={editingSoft.releaseId}
                        onValueChange={(value) => setEditingSoft({ ...editingSoft, releaseId: value })}
                      >
                        <SelectTrigger id="edit-soft-release"><SelectValue placeholder="选择发行版" /></SelectTrigger>
                        <SelectContent>
                          {app.releases.map((release) => (
                            <SelectItem key={release.id} value={release.id}>
                              {release.name} ({release.releaseId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-soft-channel">发布渠道</Label>
                      <Select
                        value={editingSoft.channelId}
                        onValueChange={(value) => setEditingSoft({ ...editingSoft, channelId: value })}
                      >
                        <SelectTrigger id="edit-soft-channel"><SelectValue placeholder="选择渠道" /></SelectTrigger>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>{channel.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-soft-description">安装包描述</Label>
                      <Textarea
                        id="edit-soft-description"
                        placeholder="输入安装包说明..."
                        value={editingSoft.description}
                        onChange={(e) => setEditingSoft({ ...editingSoft, description: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>当前文件</Label>
                      <a
                        href={resolveApiUrl(editingSoft.softUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-primary hover:underline"
                      >
                        {editingSoft.softUrl || '未找到文件地址'}
                      </a>
                    </div>
                    {softEditError && <p className="text-sm font-medium text-destructive">{softEditError}</p>}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={softEditSubmitting}>
                      {softEditSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                      保存修改
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>

        {app.releases.length > 0 ? (
          <ReleaseTable
            releases={app.releases}
            onEdit={openEditRelease}
            onDelete={(targetId) => setDeleteTarget({ type: 'release', id: targetId })}
            onEditSoft={openEditSoft}
            onDeleteSoft={(targetId) => setDeleteTarget({ type: 'soft', id: targetId })}
          />
        ) : (
          <StatePanel icon={<GitBranch className="size-5" />} title="暂无发行版" description="为这个应用添加第一个发行版以开始分发软件。" />
        )}
      </AdminPanel>

      <AdminPanel title="应用协议" description="管理协议、隐私说明和法律文本。" icon={<BookText className="size-5" />}>
        <div className="mb-4 flex justify-end">
          <Button asChild size="sm"><Link to={`/admin/apps/${id}/add-protocol`}><Plus className="size-4" /> 添加协议</Link></Button>
        </div>
        {app.protocols.length > 0 ? (
          <ProtocolTable 
            appId={id!} 
            protocols={app.protocols} 
            onDelete={(id) => setDeleteTarget({ type: 'protocol', id })} 
          />
        ) : (
          <StatePanel icon={<BookText className="size-5" />} title="暂无协议" description="为这个应用添加协议或隐私说明。" />
        )}
      </AdminPanel>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>此操作无法撤销。相关联的数据也将可能受到影响。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="mt-4">
        {label === '状态' ? <StatusBadge active={value === '启用'} /> : <p className="text-3xl font-bold tracking-tight">{value}</p>}
      </div>
    </div>
  )
}

function ReleaseTable({
  releases,
  onEdit,
  onDelete,
  onEditSoft,
  onDeleteSoft,
}: {
  releases: ReleaseDto[]
  onEdit: (r: ReleaseDto) => void
  onDelete: (id: string) => void
  onEditSoft: (releaseId: string, soft: SoftDto) => void
  onDeleteSoft: (id: string) => void
}) {
  return (
    <TableShell minWidth={900}>
      <thead className="bg-muted/50 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">名称</th>
          <th className="px-4 py-3">版本号</th>
          <th className="px-4 py-3">发布日期</th>
          <th className="px-4 py-3">描述</th>
          <th className="px-4 py-3">安装包</th>
          <th className="px-4 py-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {releases.map((release) => (
          <tr key={release.id} className="hover:bg-muted/30 transition-colors group">
            <td className="px-4 py-3 font-medium text-foreground">{release.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{release.releaseId}</td>
            <td className="px-4 py-3 text-muted-foreground">{formatDate(release.releaseDate)}</td>
            <td className="max-w-sm px-4 py-3 text-muted-foreground"><span className="line-clamp-2">{release.description || '暂无描述'}</span></td>
            <td className="px-4 py-3">
              <SoftList
                releaseId={release.id}
                softs={release.softs}
                onEdit={onEditSoft}
                onDelete={onDeleteSoft}
              />
            </td>
            <td className="px-4 py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(release)}><Pencil className="mr-2 size-4" /> 编辑</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(release.id)}><Trash2 className="mr-2 size-4" /> 删除</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function SoftList({
  releaseId,
  softs,
  onEdit,
  onDelete,
}: {
  releaseId: string
  softs: SoftDto[]
  onEdit: (releaseId: string, soft: SoftDto) => void
  onDelete: (id: string) => void
}) {
  if (softs.length === 0) return <span className="text-muted-foreground text-xs italic">暂无包</span>
  return (
    <div className="space-y-1.5 py-1">
      {softs.map((soft) => (
        <div key={soft.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-2 py-1.5">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-xs font-medium text-foreground">{soft.name}</p>
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="outline" className="text-[10px] font-semibold">
                {soft.channel?.name ?? 'DEFAULT'}
              </Badge>
              {soft.description ? (
                <span className="line-clamp-1 text-[10px] text-muted-foreground">{soft.description}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-md"
              title="编辑安装包"
              onClick={() => onEdit(releaseId, soft)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-md text-destructive hover:text-destructive"
              title="删除安装包"
              onClick={() => onDelete(soft.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="size-7 rounded-md" title="下载">
              <a href={resolveApiUrl(soft.softUrl)} target="_blank" rel="noreferrer"><Download className="size-3.5" /></a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProtocolTable({ appId, protocols, onDelete }: { appId: string, protocols: ProtocolDto[], onDelete: (id: string) => void }) {
  return (
    <TableShell minWidth={720}>
      <thead className="bg-muted/50 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">名称</th>
          <th className="px-4 py-3">描述</th>
          <th className="px-4 py-3">正文预览</th>
          <th className="px-4 py-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {protocols.map((protocol) => (
          <tr key={protocol.id} className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 font-medium text-foreground">{protocol.name}</td>
            <td className="max-w-xs px-4 py-3 text-muted-foreground"><span className="line-clamp-2">{protocol.description || '暂无描述'}</span></td>
            <td className="max-w-md px-4 py-3 text-muted-foreground"><span className="line-clamp-2 italic font-mono text-xs">{truncateText(protocol.context || '暂无正文')}</span></td>
            <td className="px-4 py-3 text-right">
              <div className="flex justify-end gap-1">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <Link to={`/admin/apps/${appId}/protocols/${protocol.id}`}><Pencil className="size-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(protocol.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
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

function AppDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-2xl border border-border/60 bg-card/60" />
      <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => (<div key={index} className="h-24 animate-pulse rounded-2xl border border-border/60 bg-card/60" />))}</div>
      <div className="h-80 animate-pulse rounded-2xl border border-border/60 bg-card/60" />
    </div>
  )
}

function BackToAppsButton() {
  return <Button asChild><Link to="/admin/apps"><ArrowLeft className="size-4" /> 返回应用列表</Link></Button>
}

function validateReleaseForm(form: NewReleaseForm) {
  if (!form.name.trim()) return '请输入发行版名称。'
  if (!form.releaseId.trim()) return '请输入版本号。'
  return ''
}

function validateSoftForm(form: NewSoftForm) {
  if (!form.name.trim()) return '请输入名称。'
  if (!form.releaseId) return '请选择发行版。'
  if (!form.channelId) return '请选择渠道。'
  if (!form.file) return '请选择文件。'
  return ''
}

function validateSoftEditForm(form: EditSoftForm) {
  if (!form.name.trim()) return '请输入名称。'
  if (!form.releaseId) return '请选择发行版。'
  if (!form.channelId) return '请选择渠道。'
  if (!form.softUrl) return '未找到当前安装包文件。'
  return ''
}

function isNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404
}
