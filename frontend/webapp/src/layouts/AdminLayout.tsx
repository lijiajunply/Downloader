import { Link, NavLink, useNavigate, type NavLinkProps } from 'react-router'
import {
  ArrowLeft,
  BookText,
  Boxes,
  GitBranch,
  LayoutDashboard,
  LogOut,
  RadioTower,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  { to: '/admin', label: '总览', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: '用户', icon: UsersRound },
  { to: '/admin/apps', label: '应用', icon: Boxes },
  { to: '/admin/releases', label: '发行版', icon: GitBranch },
  { to: '/admin/channels', label: '渠道', icon: RadioTower },
  { to: '/admin/protocols', label: '协议', icon: BookText },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                <LayoutDashboard className="size-3.5" />
                Admin Console
              </span>
              <span className="truncate">当前账号：{user?.username ?? 'Admin'}</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Downloader 管理后台
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/">
                <ArrowLeft className="size-4" />
                返回首页
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              退出登录
            </Button>
          </div>
        </div>

        <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="管理后台导航">
          {adminNavItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end as NavLinkProps['end']}
                className={({ isActive }) =>
                  isActive
                    ? 'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground shadow-apple-sm'
                    : 'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground'
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </section>

      {children}
    </div>
  )
}
