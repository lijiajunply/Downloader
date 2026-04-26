import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ArrowRight, CircleAlert, LockKeyhole, UserRound } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services'
import { StatePanel } from './pageComponents'
import { getErrorMessage } from './pageUtils'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, status } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (status === 'authenticated') {
    return <Navigate to="/admin" replace />
  }

  if (status === 'checking') {
    return (
      <StatePanel
        icon={<LockKeyhole className="size-5" />}
        title="正在恢复登录"
        description="请稍候，正在检查当前登录状态。"
      />
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextUsername = username.trim()
    const nextPassword = password.trim()

    if (!nextUsername || !nextPassword) {
      setErrorMessage('请输入用户名和密码。')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      await login({ username: nextUsername, password: nextPassword })
      navigate('/admin', { replace: true })
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError && error.status === 401
          ? '用户名或密码错误。'
          : getErrorMessage(error),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-apple-sm">
          <LockKeyhole className="size-3.5" />
          Admin Access
        </span>
        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            登录管理后台
          </h1>
          <p className="max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            使用管理员账号进入 Downloader 管理面板，维护用户和后续管理功能。
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/75 p-6 shadow-apple-lg backdrop-blur sm:p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="username">
              用户名
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="username"
                name="username"
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="root"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              密码
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="请输入密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full rounded-xl shadow-apple-md"
            disabled={submitting}
          >
            {submitting ? '正在登录' : '登录'}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </section>
    </div>
  )
}
