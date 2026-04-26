import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle, Plus, RadioTower, RotateCcw, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createChannel, getChannelList, updateChannel, deleteChannel } from '@/services'
import type { ChannelDto } from '@/types'
import type { LoadState } from '../pageComponents'
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

export function AdminChannelsPage() {
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [state, setState] = useState<LoadState<ChannelDto[]>>({ status: 'loading' })
  
  // Create
  const [name, setName] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit
  const [editingChannel, setEditingChannel] = useState<ChannelDto | null>(null)
  const [editName, setEditName] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadChannels = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const channels = await getChannelList()
      setState(asLoadState(channels))
    } catch (error) {
      setState({ status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    let ignore = false
    async function loadInitialChannels() {
      try {
        const channels = await getChannelList()
        if (ignore) return
        setState(asLoadState(channels))
      } catch (error) {
        if (ignore) return
        setState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }
    void loadInitialChannels()
    return () => { ignore = true }
  }, [])

  async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    const nextName = name.trim()
    if (!nextName) {
      setCreateError('请输入渠道名称。')
      return
    }

    setCreateSubmitting(true)
    setCreateError('')

    try {
      await createChannel({ name: nextName }, token)
      setName('')
      setCreateOpen(false)
      await loadChannels()
    } catch (error) {
      if (handleAuthFailure(error)) return
      setCreateError(getAdminErrorMessage(error))
    } finally {
      setCreateSubmitting(false)
    }
  }

  async function handleUpdateChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !editingChannel) return

    const nextName = editName.trim()
    if (!nextName) {
      setEditError('请输入渠道名称。')
      return
    }

    setEditSubmitting(true)
    setEditError('')

    try {
      await updateChannel(editingChannel.id, { name: nextName }, token)
      setEditOpen(false)
      setEditingChannel(null)
      await loadChannels()
    } catch (error) {
      if (handleAuthFailure(error)) return
      setEditError(getAdminErrorMessage(error))
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDeleteChannel() {
    if (!token || !deleteId) return
    try {
      await deleteChannel(deleteId, token)
      await loadChannels()
    } catch (error) {
      if (handleAuthFailure(error)) return
    } finally {
      setDeleteId(null)
    }
  }

  const openEdit = (channel: ChannelDto) => {
    setEditingChannel(channel)
    setEditName(channel.name)
    setEditError('')
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={<><RadioTower className="size-3.5" /> Channels</>}
        title="渠道管理"
        description="维护全局发布渠道字典。安装包在上传时会引用这些渠道以便分类分发。"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => void loadChannels()}><RotateCcw className="size-4" /></Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-apple-md"><Plus className="size-4" /> 添加渠道</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateChannel}>
                  <DialogHeader>
                    <DialogTitle>添加新渠道</DialogTitle>
                    <DialogDescription>在这里创建新的软件分发渠道（如 iOS、Android、Web）。</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="channel-name">渠道名称</Label>
                      <Input id="channel-name" placeholder="例如 iOS / Android / Web" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    {createError && <p className="text-sm font-medium text-destructive">{createError}</p>}
                  </div>
                  <DialogFooter><Button type="submit" disabled={createSubmitting}>{createSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />} 确认添加</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <AdminPanel title="渠道列表" description="所有可用的分发渠道字典。" icon={<RadioTower className="size-5" />}>
        <ResourceContent state={state} emptyTitle="暂无渠道" emptyDescription="添加渠道后，列表会显示在这里。" errorTitle="渠道加载失败" loadingColumns={2}>
          {(channels) => <ChannelTable channels={channels} onEdit={openEdit} onDelete={setDeleteId} />}
        </ResourceContent>
      </AdminPanel>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateChannel}>
            <DialogHeader>
              <DialogTitle>编辑渠道</DialogTitle>
              <DialogDescription>修改分发渠道的名称。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-channel-name">渠道名称</Label>
                <Input id="edit-channel-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
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
            <AlertDialogTitle>确认删除渠道？</AlertDialogTitle>
            <AlertDialogDescription>此操作将永久删除该渠道，且无法恢复。已绑定到该渠道的安装包可能会出现访问问题。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChannel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ChannelTable({ channels, onEdit, onDelete }: { channels: ChannelDto[], onEdit: (c: ChannelDto) => void, onDelete: (id: string) => void }) {
  return (
    <TableShell minWidth={420}>
      <thead className="bg-muted/50 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3 text-left">渠道名称</th>
          <th className="px-4 py-3 text-left">渠道 ID</th>
          <th className="px-4 py-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {channels.map((channel) => (
          <tr key={channel.id} className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 font-medium text-foreground">{channel.name}</td>
            <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{channel.id}</td>
            <td className="px-4 py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(channel)}><Pencil className="mr-2 size-4" /> 编辑</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(channel.id)}><Trash2 className="mr-2 size-4" /> 删除</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}
