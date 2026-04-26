import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Boxes, ChevronRight, LoaderCircle, Plus, RotateCcw, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createApp, getApps, getUserList, updateApp, deleteApp } from '@/services'
import type { AppDto, UserDto } from '@/types'
import type { LoadState } from '../pageComponents'
import { StatusBadge } from '../pageComponents'
import {
  AdminPageHeader,
  AdminPanel,
  ResourceContent,
  TableShell,
} from './AdminShared'
import { asLoadState, getAdminErrorMessage } from './adminUtils'
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
import { Switch } from "@/components/ui/switch"

interface NewAppForm {
  name: string
  description: string
  userId: string
}

interface EditAppForm {
  name: string
  description: string
  isActive: boolean
}

const emptyForm: NewAppForm = {
  name: '',
  description: '',
  userId: '',
}

export function AdminAppsPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [appState, setAppState] = useState<LoadState<AppDto[]>>({ status: 'loading' })
  const [users, setUsers] = useState<UserDto[]>([])
  
  // Create
  const [form, setForm] = useState<NewAppForm>(emptyForm)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit
  const [editingApp, setEditingApp] = useState<AppDto | null>(null)
  const [editForm, setEditForm] = useState<EditAppForm>({ name: '', description: '', isActive: true })
  const [editOpen, setEditOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadApps = useCallback(async () => {
    setAppState({ status: 'loading' })
    try {
      const apps = await getApps()
      setAppState(asLoadState(apps))
    } catch (error) {
      setAppState({ status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    if (!token) return
    let ignore = false
    async function loadInitialData(sessionToken: string) {
      try {
        const [apps, nextUsers] = await Promise.all([getApps(), getUserList(sessionToken)])
        if (ignore) return
        setAppState(asLoadState(apps))
        setUsers(nextUsers)
        setForm((current) => ({
          ...current,
          userId: current.userId || user?.id || nextUsers[0]?.id || '',
        }))
      } catch (error) {
        if (ignore || handleAuthFailure(error)) return
        setAppState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }
    void loadInitialData(token)
    return () => { ignore = true }
  }, [handleAuthFailure, token, user?.id])

  async function handleCreateApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    const validationMessage = validateForm(form)
    if (validationMessage) {
      setCreateError(validationMessage)
      return
    }

    setCreateSubmitting(true)
    setCreateError('')

    try {
      const createdApp = await createApp({
          name: form.name.trim(),
          description: form.description.trim(),
          userId: form.userId,
        },
        token,
      )
      setForm((current) => ({ ...emptyForm, userId: current.userId }))
      setCreateOpen(false)
      navigate(`/admin/apps/${encodeURIComponent(createdApp.id)}`)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setCreateError(getAdminErrorMessage(error))
    } finally {
      setCreateSubmitting(false)
    }
  }

  async function handleUpdateApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !editingApp) return

    if (!editForm.name.trim()) {
      setEditError('请输入应用名称。')
      return
    }

    setEditSubmitting(true)
    setEditError('')

    try {
      await updateApp(editingApp.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        isActive: editForm.isActive,
      }, token)
      setEditOpen(false)
      setEditingApp(null)
      await loadApps()
    } catch (error) {
      if (handleAuthFailure(error)) return
      setEditError(getAdminErrorMessage(error))
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDeleteApp() {
    if (!token || !deleteId) return
    try {
      await deleteApp(deleteId, token)
      await loadApps()
    } catch (error) {
      if (handleAuthFailure(error)) return
    } finally {
      setDeleteId(null)
    }
  }

  const openEdit = (app: AppDto) => {
    setEditingApp(app)
    setEditForm({
      name: app.name,
      description: app.description,
      isActive: app.isActive,
    })
    setEditError('')
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={<><Boxes className="size-3.5" /> Apps</>}
        title="应用管理"
        description="管理系统中的所有应用，配置其版本及相关协议。"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => void loadApps()}><RotateCcw className="size-4" /></Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-apple-md"><Plus className="size-4" /> 添加应用</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateApp}>
                  <DialogHeader>
                    <DialogTitle>创建新应用</DialogTitle>
                    <DialogDescription>填写应用基本信息。应用必须绑定到一个负责用户。</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="app-name">应用名称</Label>
                      <Input id="app-name" placeholder="例如 Downloader" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="app-description">应用描述</Label>
                      <Textarea id="app-description" placeholder="输入应用说明..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="app-user">归属用户</Label>
                      <Select value={form.userId} onValueChange={(value) => setForm({ ...form, userId: value })}>
                        <SelectTrigger id="app-user"><SelectValue placeholder="选择负责用户" /></SelectTrigger>
                        <SelectContent>{users.map((item) => <SelectItem key={item.id} value={item.id}>{item.username}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {createError && <p className="text-sm font-medium text-destructive">{createError}</p>}
                  </div>
                  <DialogFooter><Button type="submit" disabled={createSubmitting}>{createSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />} 确认创建</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <AdminPanel title="应用列表" description="点击“查看”进入详情页管理发行版和协议。" icon={<Boxes className="size-5" />}>
        <ResourceContent state={appState} emptyTitle="暂无应用" emptyDescription="创建应用后，它会显示在这里。" errorTitle="应用加载失败">
          {(apps) => <AppTable apps={apps} onEdit={openEdit} onDelete={setDeleteId} />}
        </ResourceContent>
      </AdminPanel>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateApp}>
            <DialogHeader>
              <DialogTitle>编辑应用: {editingApp?.name}</DialogTitle>
              <DialogDescription>修改应用的基本信息及启用状态。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">应用名称</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">应用描述</Label>
                <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="edit-active">启用状态</Label>
                <Switch id="edit-active" checked={editForm.isActive} onCheckedChange={(val) => setEditForm({ ...editForm, isActive: val })} />
              </div>
              {editError && <p className="text-sm font-medium text-destructive">{editError}</p>}
            </div>
            <DialogFooter><Button type="submit" disabled={editSubmitting}>{editSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />} 保存修改</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除应用？</AlertDialogTitle>
            <AlertDialogDescription>此操作将永久删除该应用及其关联的所有数据（发行版、安装包、协议），且无法恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AppTable({ apps, onEdit, onDelete }: { apps: AppDto[], onEdit: (app: AppDto) => void, onDelete: (id: string) => void }) {
  return (
    <TableShell minWidth={760}>
      <thead className="bg-muted/50 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3 text-left">应用名称</th>
          <th className="px-4 py-3 text-left">描述</th>
          <th className="px-4 py-3 text-left">状态</th>
          <th className="px-4 py-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {apps.map((app) => (
          <tr key={app.id} className="hover:bg-muted/30 transition-colors group">
            <td className="px-4 py-3 font-medium text-foreground">{app.name}</td>
            <td className="max-w-sm px-4 py-3 text-muted-foreground"><span className="line-clamp-2">{app.description || '暂无描述'}</span></td>
            <td className="px-4 py-3"><StatusBadge active={app.isActive} /></td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg"><Link to={`/admin/apps/${encodeURIComponent(app.id)}`}>查看</Link></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(app)}><Pencil className="mr-2 size-4" /> 编辑</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(app.id)}><Trash2 className="mr-2 size-4" /> 删除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function validateForm(form: NewAppForm) {
  if (!form.name.trim()) return '请输入应用名称。'
  if (!form.description.trim()) return '请输入应用描述。'
  if (!form.userId) return '请选择归属用户。'
  return ''
}
