import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, LoaderCircle, Plus, UserPlus, UsersRound, XCircle } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createUser, getUserList } from '@/services'
import type { UserDto } from '@/types'
import type { LoadState } from '../pageComponents'
import {
  AdminPageHeader,
  AdminPanel,
  InlineMessage,
  ResourceContent,
  TableShell,
  TextField,
} from './AdminShared'
import { asLoadState, getAdminErrorMessage } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'

interface NewUserForm {
  username: string
  email: string
  password: string
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
  const [form, setForm] = useState<NewUserForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

    return () => {
      ignore = true
    }
  }, [handleAuthFailure, token])

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) return

    const validationMessage = validateForm(form)
    if (validationMessage) {
      setFormError(validationMessage)
      setSuccessMessage('')
      return
    }

    setSubmitting(true)
    setFormError('')
    setSuccessMessage('')

    try {
      const createdUser = await createUser(
        {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        },
        token,
      )
      setState((current) => {
        if (current.status !== 'success') {
          return { status: 'success', data: [createdUser] }
        }

        return { status: 'success', data: [createdUser, ...current.data] }
      })
      setForm(emptyForm)
      setSuccessMessage(`已添加用户 ${createdUser.username}。`)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setFormError(getAdminErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={
          <>
            <UsersRound className="size-3.5" />
            Users
          </>
        }
        title="用户管理"
        description="查看用户列表，并添加新的普通用户。"
        action={
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void loadUsers()}>
            刷新
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <AdminPanel
          title="用户列表"
          description="来自后端 Admin 用户接口。"
          icon={<UsersRound className="size-5" />}
        >
          <ResourceContent
            state={state}
            emptyTitle="暂无用户"
            emptyDescription="添加第一个用户后，列表会显示在这里。"
            errorTitle="用户加载失败"
          >
            {(users) => <UserTable users={users} />}
          </ResourceContent>
        </AdminPanel>

        <AdminPanel
          title="添加新用户"
          description="新用户将以普通 User 身份创建。"
          icon={<UserPlus className="size-5" />}
        >
          <form className="space-y-4" onSubmit={handleCreateUser}>
            <TextField
              id="new-username"
              label="用户名"
              value={form.username}
              autoComplete="username"
              placeholder="例如 alice"
              onChange={(value) => setForm((current) => ({ ...current, username: value }))}
            />
            <TextField
              id="new-email"
              label="邮箱"
              type="email"
              value={form.email}
              autoComplete="email"
              placeholder="alice@example.com"
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            />
            <TextField
              id="new-password"
              label="初始密码"
              type="password"
              value={form.password}
              autoComplete="new-password"
              placeholder="请输入初始密码"
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
            />

            {formError ? <InlineMessage tone="error" message={formError} /> : null}
            {successMessage ? <InlineMessage tone="success" message={successMessage} /> : null}

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl shadow-apple-md"
              disabled={submitting}
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {submitting ? '正在添加' : '添加用户'}
            </Button>
          </form>
        </AdminPanel>
      </div>
    </div>
  )
}

function UserTable({ users }: { users: UserDto[] }) {
  return (
    <TableShell minWidth={680}>
      <thead className="bg-secondary/60 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">用户名</th>
          <th className="px-4 py-3">邮箱</th>
          <th className="px-4 py-3">身份</th>
          <th className="px-4 py-3">邮箱状态</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {users.map((item) => (
          <tr key={item.id} className="bg-background/40">
            <td className="px-4 py-3 font-medium text-foreground">{item.username}</td>
            <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
            <td className="px-4 py-3">
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {item.identity || 'User'}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                {item.emailConfirmed ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <XCircle className="size-4" />
                )}
                {item.emailConfirmed ? '已确认' : '未确认'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function validateForm(form: NewUserForm) {
  if (!form.username.trim()) {
    return '请输入用户名。'
  }

  if (!form.email.trim()) {
    return '请输入邮箱。'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return '请输入有效的邮箱地址。'
  }

  if (!form.password) {
    return '请输入初始密码。'
  }

  return ''
}
