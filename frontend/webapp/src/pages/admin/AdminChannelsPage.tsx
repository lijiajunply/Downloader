import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle, Plus, RadioTower } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createChannel, getChannelList } from '@/services'
import type { ChannelDto } from '@/types'
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

export function AdminChannelsPage() {
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [state, setState] = useState<LoadState<ChannelDto[]>>({ status: 'loading' })
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadChannels = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      const channels = await getChannelList()
      setState(asLoadState(channels))
    } catch (error) {
      setState({ status: 'error', message: getAdminErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadInitialChannels() {
      try {
        const channels = await getChannelList()
        if (ignore) return
        setState(asLoadState(channels))
      } catch (error) {
        if (ignore) return
        setState({ status: 'error', message: getAdminErrorMessage(error) })
      }
    }

    void loadInitialChannels()

    return () => {
      ignore = true
    }
  }, [])

  async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) return

    const nextName = name.trim()
    if (!nextName) {
      setFormError('请输入渠道名称。')
      setSuccessMessage('')
      return
    }

    setSubmitting(true)
    setFormError('')
    setSuccessMessage('')

    try {
      const createdChannel = await createChannel({ name: nextName }, token)
      setState((current) => {
        if (current.status !== 'success') {
          return { status: 'success', data: [createdChannel] }
        }

        return { status: 'success', data: [createdChannel, ...current.data] }
      })
      setName('')
      setSuccessMessage(`已添加渠道 ${createdChannel.name}。`)
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
            <RadioTower className="size-3.5" />
            Channels
          </>
        }
        title="渠道管理"
        description="维护全局渠道字典；软件实体会在后续 Soft 管理中引用渠道。"
        action={
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void loadChannels()}>
            刷新
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminPanel title="渠道列表" description="全局渠道字典。" icon={<RadioTower className="size-5" />}>
          <ResourceContent
            state={state}
            emptyTitle="暂无渠道"
            emptyDescription="添加渠道后，列表会显示在这里。"
            errorTitle="渠道加载失败"
            loadingColumns={2}
          >
            {(channels) => <ChannelTable channels={channels} />}
          </ResourceContent>
        </AdminPanel>

        <AdminPanel title="添加渠道" description="渠道名称应简洁清晰。" icon={<Plus className="size-5" />}>
          <form className="space-y-4" onSubmit={handleCreateChannel}>
            <TextField
              id="channel-name"
              label="渠道名称"
              value={name}
              autoComplete="off"
              placeholder="例如 iOS / Android / Web"
              onChange={setName}
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
              {submitting ? '正在添加' : '添加渠道'}
            </Button>
          </form>
        </AdminPanel>
      </div>
    </div>
  )
}

function ChannelTable({ channels }: { channels: ChannelDto[] }) {
  return (
    <TableShell minWidth={420}>
      <thead className="bg-secondary/60 text-xs font-medium text-muted-foreground">
        <tr>
          <th className="px-4 py-3">渠道名称</th>
          <th className="px-4 py-3">ID</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {channels.map((channel) => (
          <tr key={channel.id} className="bg-background/40">
            <td className="px-4 py-3 font-medium text-foreground">{channel.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{channel.id}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}
