import { useState, type FormEvent, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, BookText, LoaderCircle, Save, Eye, Edit3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { getProtocol, updateProtocol } from '@/services'
import { AdminPageHeader, AdminPanel } from './AdminShared'
import { getAdminErrorMessage } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatePanel } from '../pageComponents'

interface ProtocolForm {
  name: string
  description: string
  context: string
}

export function AdminEditProtocolPage() {
  const { id: appId, protocolId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [form, setForm] = useState<ProtocolForm>({ name: '', description: '', context: '' })
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")

  useEffect(() => {
    if (!protocolId) return

    async function loadProtocol() {
      try {
        const data = await getProtocol(protocolId!)
        setForm({
          name: data.name,
          description: data.description,
          context: data.context,
        })
      } catch (error) {
        setFormError(getAdminErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    void loadProtocol()
  }, [protocolId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !protocolId || !appId) return

    if (!form.name.trim() || !form.description.trim() || !form.context.trim()) {
      setFormError('所有字段均为必填项。')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      await updateProtocol(protocolId, {
        name: form.name.trim(),
        description: form.description.trim(),
        context: form.context.trim(),
      }, token)
      navigate(`/admin/apps/${encodeURIComponent(appId)}`)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setFormError(getAdminErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><LoaderCircle className="size-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={
          <>
            <BookText className="size-3.5" />
            Protocols
          </>
        }
        title="编辑协议"
        description="修改应用的协议或政策内容。支持 Markdown 格式。"
        action={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to={`/admin/apps/${appId}`}>
              <ArrowLeft className="size-4" />
              取消并返回
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <AdminPanel title="协议内容" icon={<Edit3 className="size-5" />}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-full max-w-[200px] grid-cols-2">
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Edit3 className="size-3.5" />
                    编辑
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="size-3.5" />
                    预览
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="edit" className="mt-0">
                <Textarea
                  id="context"
                  placeholder="在这里输入协议正文..."
                  className="min-h-[500px] font-mono leading-relaxed"
                  value={form.context}
                  onChange={(e) => setForm({ ...form, context: e.target.value })}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <div className="min-h-[500px] rounded-md border bg-background/50 p-6 prose prose-slate dark:prose-invert max-w-none overflow-auto">
                  <ReactMarkdown>{form.context}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title="基本信息" icon={<BookText className="size-5" />}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">协议名称</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">简短描述</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              
              {formError && (
                <p className="text-sm font-medium text-destructive">{formError}</p>
              )}

              <Button type="submit" size="lg" className="w-full mt-2 shadow-apple-md" disabled={submitting}>
                {submitting ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                保存修改
              </Button>
            </div>
          </AdminPanel>
        </div>
      </form>
    </div>
  )
}
