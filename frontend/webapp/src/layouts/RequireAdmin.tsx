import { Link, Navigate } from 'react-router'
import { Home, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { StatePanel } from '@/pages/pageComponents'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
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

  return children
}

function AdminAccessDenied() {
  return (
    <StatePanel
      icon={<ShieldAlert className="size-5" />}
      title="没有管理权限"
      description="当前账号不是 Admin，无法访问管理面板。"
      action={
        <Button asChild>
          <Link to="/">
            <Home className="size-4" />
            返回首页
          </Link>
        </Button>
      }
    />
  )
}
