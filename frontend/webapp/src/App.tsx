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
    <div className="min-h-svh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_62%)]" />
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm">
              <ArrowDownToLine className="size-4" aria-hidden="true" />
            </span>
            Downloader
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗黑模式'}
            title={theme === 'dark' ? '切换到亮色模式' : '切换到暗黑模式'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
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
