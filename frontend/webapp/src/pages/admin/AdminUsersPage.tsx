import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, LoaderCircle, Plus, UsersRound, XCircle, RotateCcw, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createUser, getUserList, updateUser, deleteUser } from '@/services'
import type { UserDto } from '@/types'
import type { LoadState } from '../pageComponents'
import {
  AdminPageHeader,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NewUserForm {
  username: string
  email: string
  password: string
}

interface EditUserForm {
  email: string
  identity: string
}

const emptyForm: NewUserForm = {
  username: '',
  email: '',
  password: '',
}

export function AdminUsersPage() {
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [state, setState] = useState<LoadState<UserDto[]>>({ status: 'loading' })

  // Create Form
  const [form, setForm] = useState<NewUserForm>(emptyForm)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit Form
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)
  const [editForm, setEditForm] = useState<EditUserForm>({ email: '', identity: 'User' })
  const [editOpen, setEditOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    if (!token) return
    setState({ status: 'loading' })
    try {
      const users = await getUserList(token)
      setState(asLoadState(users))
    } catch (error) {
      if (handleAuthFailure(error)) return
      setState({ status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [handleAuthFailure, token])

  useEffect(() => {
    if (!token) return
    let ignore = false
    async function loadInitialUsers(sessionToken: string) {
      try {
        const users = await getUserList(sessionToken)
        if (ignore) return
        setState(asLoadState(users))
      } catch (error) {
        if (ignore || handleAuthFailure(error)) return
        setState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }
    void loadInitialUsers(token)
    return () => { ignore = true }
  }, [handleAuthFailure, token])

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    const validationMessage = validateCreateForm(form)
    if (validationMessage) {
      setCreateError(validationMessage)
      return
    }

    setCreateSubmitting(true)
    setCreateError('')

    try {
      await createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      },
        token,
      )
      setForm(emptyForm)
      setCreateOpen(false)
      await loadUsers()
    } catch (error) {
      if (handleAuthFailure(error)) return
      setCreateError(getAdminErrorMessage(error))
    } finally {
      setCreateSubmitting(false)
    }
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !editingUser) return

    if (!editForm.email.trim()) {
      setEditError('请输入邮箱。')
      return
    }

    setEditSubmitting(true)
    setEditError('')

    try {
      await updateUser(editingUser.id, {
        email: editForm.email.trim(),
        identity: editForm.identity,
      }, token)
      setEditOpen(false)
      setEditingUser(null)
      await loadUsers()
    } catch (error) {
      if (handleAuthFailure(error)) return
      setEditError(getAdminErrorMessage(error))
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDeleteUser() {
    if (!token || !deleteId) return
    try {
      await deleteUser(deleteId, token)
      await loadUsers()
    } catch (error) {
      if (handleAuthFailure(error)) return
    } finally {
      setDeleteId(null)
    }
  }

  const openEdit = (user: UserDto) => {
    setEditingUser(user)
    setEditForm({ email: user.email, identity: user.identity || 'User' })
    setEditError('')
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={<><UsersRound className="size-3.5" /> Users</>}
        title="用户管理"
        description="管理系统用户信息，包括账号创建、信息编辑及权限管理。"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => void loadUsers()}><RotateCcw className="size-4" /></Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-apple-md"><Plus className="size-4" /> 添加用户</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>添加新用户</DialogTitle>
                    <DialogDescription>创建新的系统用户。默认身份为普通用户。</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input id="username" placeholder="例如 alice" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input id="email" type="email" placeholder="alice@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">初始密码</Label>
                      <Input id="password" type="password" placeholder="请输入初始密码" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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

      <ResourceContent state={state} emptyTitle="暂无用户" emptyDescription="添加第一个用户后，列表会显示在这里。" errorTitle="用户加载失败">
        {(users) => <UserTable users={users} onEdit={openEdit} onDelete={setDeleteId} />}
      </ResourceContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>编辑用户: {editingUser?.username}</DialogTitle>
              <DialogDescription>修改用户邮箱或身份权限。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">邮箱</Label>
                <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-identity">身份</Label>
                <Select value={editForm.identity} onValueChange={(val) => setEditForm({ ...editForm, identity: val })}>
                  <SelectTrigger id="edit-identity"><SelectValue placeholder="选择身份" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">普通用户 (User)</SelectItem>
                    <SelectItem value="Admin">管理员 (Admin)</SelectItem>
                  </SelectContent>
                </Select>
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
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>此操作将永久删除该用户账号，且无法恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserTable({ users, onEdit, onDelete }: { users: UserDto[], onEdit: (u: UserDto) => void, onDelete: (id: string) => void }) {
  return (
    <TableShell minWidth={680}>
      <thead className="bg-muted/50 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3 text-left">用户名</th>
          <th className="px-4 py-3 text-left">邮箱</th>
          <th className="px-4 py-3 text-left">身份</th>
          <th className="px-4 py-3 text-left">状态</th>
          <th className="px-4 py-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {users.map((item) => (
          <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
            <td className="px-4 py-3 font-medium text-foreground">{item.username}</td>
            <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.identity === 'Admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary/10 text-primary'}`}>
                {item.identity || 'User'}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                {item.emailConfirmed ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4" />}
                {item.emailConfirmed ? '已确认' : '未确认'}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}><Pencil className="mr-2 size-4" /> 编辑</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="mr-2 size-4" /> 删除</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function validateCreateForm(form: NewUserForm) {
  if (!form.username.trim()) return '请输入用户名。'
  if (!form.email.trim()) return '请输入邮箱。'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return '请输入有效的邮箱地址。'
  if (!form.password) return '请输入初始密码。'
  return ''
}
