import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Boxes, ChevronRight, LoaderCircle, Plus } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createApp, getApps, getUserList } from '@/services'
import type { AppDto, UserDto } from '@/types'
import type { LoadState } from '../pageComponents'
import { StatusBadge } from '../pageComponents'
import {
  AdminPageHeader,
  AdminPanel,
  InlineMessage,
  ResourceContent,
  SelectField,
  TableShell,
  TextAreaField,
  TextField,
} from './AdminShared'
import { asLoadState, getAdminErrorMessage } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'

interface NewAppForm {
  name: string
  description: string
  userId: string
}

const emptyForm: NewAppForm = {
  name: '',
  description: '',
  userId: '',
}

export function AdminAppsPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [appState, setAppState] = useState<LoadState<AppDto[]>>({ status: 'loading' })
  const [users, setUsers] = useState<UserDto[]>([])
  const [form, setForm] = useState<NewAppForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadApps = useCallback(async () => {
    setAppState({ status: 'loading' })

    try {
      const apps = await getApps()
      setAppState(asLoadState(apps))
    } catch (error) {
      setAppState({ status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    if (!token) return

    let ignore = false

    async function loadInitialData(sessionToken: string) {
      try {
        const [apps, nextUsers] = await Promise.all([getApps(), getUserList(sessionToken)])
        if (ignore) return

        setAppState(asLoadState(apps))
        setUsers(nextUsers)
        setForm((current) => ({
          ...current,
          userId: current.userId || user?.id || nextUsers[0]?.id || '',
        }))
      } catch (error) {
        if (ignore || handleAuthFailure(error)) return
        setAppState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }

    void loadInitialData(token)

    return () => {
      ignore = true
    }
  }, [handleAuthFailure, token, user?.id])

  async function handleCreateApp(event: FormEvent<HTMLFormElement>) {
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
      const createdApp = await createApp(
        {
          name: form.name.trim(),
          description: form.description.trim(),
          userId: form.userId,
        },
        token,
      )
      setForm((current) => ({ ...emptyForm, userId: current.userId }))
      setSuccessMessage(`已创建应用 ${createdApp.name}。`)
      navigate(`/admin/apps/${encodeURIComponent(createdApp.id)}`)
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
            <Boxes className="size-3.5" />
            Apps
          </>
        }
        title="应用管理"
        description="查看应用列表，创建应用后可进入详情维护发行版和协议。"
        action={
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void loadApps()}>
            刷新
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <AdminPanel
          title="应用列表"
          description="应用详情页承载发行版和协议管理。"
          icon={<Boxes className="size-5" />}
        >
          <ResourceContent
            state={appState}
            emptyTitle="暂无应用"
            emptyDescription="创建应用后，它会显示在这里。"
            errorTitle="应用加载失败"
          >
            {(apps) => <AppTable apps={apps} />}
          </ResourceContent>
        </AdminPanel>

        <AdminPanel
          title="添加应用"
          description="应用必须绑定一个用户。"
          icon={<Plus className="size-5" />}
        >
          <form className="space-y-4" onSubmit={handleCreateApp}>
            <TextField
              id="app-name"
              label="应用名称"
              value={form.name}
              autoComplete="off"
              placeholder="例如 Downloader"
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            />
            <TextAreaField
              id="app-description"
              label="应用描述"
              value={form.description}
              placeholder="输入应用说明"
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            />
            <SelectField
              id="app-user"
              label="归属用户"
              value={form.userId}
              onChange={(value) => setForm((current) => ({ ...current, userId: value }))}
            >
              <option value="">请选择用户</option>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.username}
                </option>
              ))}
            </SelectField>

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
              {submitting ? '正在创建' : '创建应用'}
            </Button>
          </form>
        </AdminPanel>
      </div>
    </div>
  )
}

function AppTable({ apps }: { apps: AppDto[] }) {
  return (
    <TableShell minWidth={760}>
      <thead className="bg-secondary/60 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">应用</th>
          <th className="px-4 py-3">描述</th>
          <th className="px-4 py-3">状态</th>
          <th className="px-4 py-3 text-right">详情</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {apps.map((app) => (
          <tr key={app.id} className="bg-background/40">
            <td className="px-4 py-3 font-medium text-foreground">{app.name}</td>
            <td className="max-w-sm px-4 py-3 text-muted-foreground">
              <span className="line-clamp-2">{app.description || '暂无描述'}</span>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={app.isActive} />
            </td>
            <td className="px-4 py-3 text-right">
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link to={`/admin/apps/${encodeURIComponent(app.id)}`}>
                  查看
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function validateForm(form: NewAppForm) {
  if (!form.name.trim()) {
    return '请输入应用名称。'
  }

  if (!form.description.trim()) {
    return '请输入应用描述。'
  }

  if (!form.userId) {
    return '请选择归属用户。'
  }

  return ''
}
