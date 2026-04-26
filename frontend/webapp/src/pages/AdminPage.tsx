import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Plus,
  RefreshCw,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { ApiError, createUser, getUserList } from '@/services'
import type { UserDto } from '@/types'
import { type LoadState, StatePanel } from './pageComponents'
import { getErrorMessage } from './pageUtils'

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

export function AdminPage() {
  const navigate = useNavigate()
  const { token, user, logout } = useAuth()
  const [state, setState] = useState<LoadState<UserDto[]>>({ status: 'loading' })
  const [form, setForm] = useState<NewUserForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAuthFailure = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return true
      }

      return false
    },
    [logout, navigate],
  )

  const loadUsers = useCallback(async (showLoading = true) => {
    if (!token) return

    if (showLoading) {
      setState({ status: 'loading' })
    }

    try {
      const users = await getUserList(token)
      setState(users.length > 0 ? { status: 'success', data: users } : { status: 'empty' })
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
        setState(users.length > 0 ? { status: 'success', data: users } : { status: 'empty' })
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
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-apple-sm">
            <ShieldCheck className="size-3.5" />
            Admin
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">管理面板</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              当前登录为 {user?.username ?? '管理员'}，可以查看用户列表并添加新的普通用户。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => void loadUsers()}
          >
            <RefreshCw className="size-4" />
            刷新
          </Button>
          <Button asChild variant="ghost" className="rounded-xl">
            <Link to="/">返回首页</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <UsersRound className="size-5 text-primary" />
                用户列表
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">来自后端 Admin 用户接口。</p>
            </div>
          </div>
          <div className="mt-5">{renderUserContent(state)}</div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <UserPlus className="size-5 text-primary" />
            添加新用户
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">新用户将以普通 User 身份创建。</p>

          <form className="mt-5 space-y-4" onSubmit={handleCreateUser}>
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
        </section>
      </div>
    </div>
  )
}

function renderUserContent(state: LoadState<UserDto[]>) {
  if (state.status === 'loading') {
    return <UserTableSkeleton />
  }

  if (state.status === 'empty') {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="暂无用户"
        description="添加第一个用户后，列表会显示在这里。"
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StatePanel
        icon={<CircleAlert className="size-5" />}
        title="用户加载失败"
        description={state.message}
      />
    )
  }

  if (state.status === 'not-found') {
    return null
  }

  return <UserTable users={state.data} />
}

function UserTable({ users }: { users: UserDto[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
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
        </table>
      </div>
    </div>
  )
}

function UserTableSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-4">
          <div className="h-5 animate-pulse rounded-md bg-muted" />
          <div className="h-5 animate-pulse rounded-md bg-muted sm:col-span-2" />
          <div className="h-5 animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder: string
  type?: 'text' | 'email' | 'password'
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function InlineMessage({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  const isError = tone === 'error'

  return (
    <div
      className={
        isError
          ? 'flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          : 'flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary'
      }
    >
      {isError ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      <p>{message}</p>
    </div>
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

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return '当前账号没有 Admin 权限。'
  }

  return getErrorMessage(error)
}

export function AdminAccessDenied() {
  return (
    <StatePanel
      icon={<ShieldAlert className="size-5" />}
      title="没有管理权限"
      description="当前账号不是 Admin，无法访问管理面板。"
      action={
        <Button asChild>
          <Link to="/">返回首页</Link>
        </Button>
      }
    />
  )
}
