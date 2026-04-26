import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  BookText,
  Boxes,
  ChevronRight,
  GitBranch,
  Layers3,
  RadioTower,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { getApps, getChannelList, getProtocolList, getReleaseList, getUserList } from '@/services'
import { Button } from '@/components/ui/button'
import type { LoadState } from '../pageComponents'
import { AdminPageHeader, AdminPanel } from './AdminShared'
import { getAdminErrorMessage } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'

interface DashboardStats {
  users: number
  apps: number
  releases: number
  channels: number
  protocols: number
}

const emptyStats: DashboardStats = {
  users: 0,
  apps: 0,
  releases: 0,
  channels: 0,
  protocols: 0,
}

export function AdminDashboardPage() {
  const { token, user } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [state, setState] = useState<LoadState<DashboardStats>>({ status: 'loading' })

  useEffect(() => {
    if (!token) return

    let ignore = false

    async function loadDashboard(sessionToken: string) {
      try {
        const [users, apps, channels, releases, protocols] = await Promise.all([
          getUserList(sessionToken),
          getApps(),
          getChannelList(),
          getReleaseList(),
          getProtocolList(),
        ])
        if (ignore) return
        setState({
          status: 'success',
          data: {
            users: users.length,
            apps: apps.length,
            channels: channels.length,
            releases: releases.length,
            protocols: protocols.length,
          },
        })
      } catch (error) {
        if (ignore || handleAuthFailure(error)) return
        setState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }

    void loadDashboard(token)

    return () => {
      ignore = true
    }
  }, [handleAuthFailure, token])

  const stats = state.status === 'success' ? state.data : emptyStats

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={
          <>
            <ShieldCheck className="size-3.5" />
            Admin
          </>
        }
        title="管理后台"
        description={`当前登录为 ${user?.username ?? '管理员'}，可以维护用户、应用、发行版、渠道和协议。`}
      />

      {state.status === 'error' ? (
        <AdminPanel title="加载失败" icon={<ShieldCheck className="size-5" />}>
          <p className="text-sm text-destructive">{state.message}</p>
        </AdminPanel>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<UsersRound className="size-5" />} label="用户" value={stats.users} />
        <StatCard icon={<Boxes className="size-5" />} label="应用" value={stats.apps} />
        <StatCard icon={<GitBranch className="size-5" />} label="发行版" value={stats.releases} />
        <StatCard icon={<RadioTower className="size-5" />} label="渠道" value={stats.channels} />
        <StatCard icon={<BookText className="size-5" />} label="协议" value={stats.protocols} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <EntryCard
          icon={<UsersRound className="size-5" />}
          title="用户"
          description="查看用户列表并添加普通用户。"
          to="/admin/users"
        />
        <EntryCard
          icon={<Boxes className="size-5" />}
          title="应用"
          description="创建应用，并进入详情维护发行版和协议。"
          to="/admin/apps"
        />
        <EntryCard
          icon={<Layers3 className="size-5" />}
          title="发行版"
          description="查看全局发行版索引。"
          to="/admin/releases"
        />
        <EntryCard
          icon={<RadioTower className="size-5" />}
          title="渠道"
          description="维护全局渠道字典。"
          to="/admin/channels"
        />
      </section>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

function EntryCard({
  icon,
  title,
  description,
  to,
}: {
  icon: React.ReactNode
  title: string
  description: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/60 bg-card/70 p-5 shadow-apple-sm transition hover:border-primary/30 hover:shadow-apple-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <Button type="button" variant="ghost" size="icon" className="rounded-full">
          <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
        </Button>
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  )
}
