import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router'
import {
  ArrowDownToLine,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  ShieldAlert,
  Sun,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { AppDetailPage } from '@/pages/AppDetailPage'
import { HomePage } from '@/pages/HomePage'
import { AdminAccessDenied, AdminPage } from '@/pages/AdminPage'
import { LoginPage } from '@/pages/LoginPage'
import { StatePanel } from '@/pages/pageComponents'

type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'downloader-theme'

function App() {
  const { theme, toggleTheme } = useThemeMode()

  return (
    <div className="min-h-svh bg-background text-foreground transition-colors duration-300">
      {/* Apple-style hero gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[70vh]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,color-mix(in_oklch,var(--primary)_14%,transparent)_0%,transparent_100%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,color-mix(in_oklch,var(--primary)_9%,transparent)_0%,transparent_100%)]" />
      </div>

      {/* macOS-style header */}
      <AppHeader theme={theme} toggleTheme={toggleTheme} />

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apps/:id" element={<AppDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function AppHeader({
  theme,
  toggleTheme,
}: {
  theme: ThemeMode
  toggleTheme: () => void
}) {
  const navigate = useNavigate()
  const { status, user, logout } = useAuth()
  const isAuthenticated = status === 'authenticated'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/65">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          to="/"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight transition hover:opacity-80"
        >
          <span className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-apple-sm transition group-hover:shadow-apple-md">
            <ArrowDownToLine className="size-4.5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Downloader</span>
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" className="rounded-full text-muted-foreground">
                <Link to="/admin">
                  <LayoutDashboard className="size-4" />
                  <span className="hidden sm:inline">管理后台</span>
                </Link>
              </Button>
              <span className="hidden max-w-28 truncate text-xs text-muted-foreground md:inline">
                {user?.username}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="退出登录"
                title="退出登录"
                onClick={handleLogout}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4.5" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" className="rounded-full text-muted-foreground">
              <Link to="/login">
                <LogIn className="size-4" />
                <span className="hidden sm:inline">登录</span>
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗黑模式'}
            title={theme === 'dark' ? '切换到亮色模式' : '切换到暗黑模式'}
            onClick={toggleTheme}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </Button>
        </div>
      </div>
    </header>
  )
}

function AdminRoute() {
  const { status, user } = useAuth()

  if (status === 'checking') {
    return (
      <StatePanel
        icon={<ShieldAlert className="size-5" />}
        title="正在检查权限"
        description="请稍候，正在恢复当前登录状态。"
      />
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (user?.identity !== 'Admin') {
    return <AdminAccessDenied />
  }

  return <AdminPage />
}

function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }
}

function getInitialTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(themeStorageKey)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default App
