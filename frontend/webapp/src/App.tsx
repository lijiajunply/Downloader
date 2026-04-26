import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router'
import { ArrowDownToLine, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppDetailPage } from '@/pages/AppDetailPage'
import { HomePage } from '@/pages/HomePage'

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
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/65">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight transition hover:opacity-80"
          >
            <span className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-card shadow-apple-sm text-foreground transition group-hover:shadow-apple-md">
              <ArrowDownToLine className="size-4.5" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">Downloader</span>
          </Link>

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
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apps/:id" element={<AppDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
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
