import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, BookText, LoaderCircle, Save, Eye, Edit3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { createProtocol } from '@/services'
import { AdminPageHeader, AdminPanel } from './AdminShared'
import { getAdminErrorMessage } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NewProtocolForm {
  name: string
  description: string
  context: string
}

const emptyForm: NewProtocolForm = {
  name: '',
  description: '',
  context: '',
}

export function AdminAddProtocolPage() {
  const { id: appId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const handleAuthFailure = useAdminAuthFailure()
  const [form, setForm] = useState<NewProtocolForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !appId) return

    const validationMessage = validateForm(form)
    if (validationMessage) {
      setFormError(validationMessage)
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      await createProtocol(
        {
          name: form.name.trim(),
          description: form.description.trim(),
          context: form.context.trim(),
          appId: appId,
        },
        token,
      )
      navigate(`/admin/apps/${encodeURIComponent(appId)}`)
    } catch (error) {
      if (handleAuthFailure(error)) return
      setFormError(getAdminErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
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
        title="添加新协议"
        description="为应用创建法律声明、用户协议或隐私政策。支持 Markdown 格式正文。"
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
                <span className="text-xs text-muted-foreground">支持标准 Markdown 语法</span>
              </div>
              
              <TabsContent value="edit" className="mt-0">
                <div className="grid gap-2">
                  <Label htmlFor="context" className="sr-only">正文内容</Label>
                  <Textarea
                    id="context"
                    placeholder="在这里输入协议正文，支持 Markdown..."
                    className="min-h-[500px] font-mono leading-relaxed"
                    value={form.context}
                    onChange={(e) => setForm({ ...form, context: e.target.value })}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <div className="min-h-[500px] rounded-md border bg-background/50 p-6 prose prose-slate dark:prose-invert max-w-none overflow-auto">
                  {form.context.trim() ? (
                    <ReactMarkdown>{form.context}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic text-center py-20">暂无预览内容</p>
                  )}
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
                  placeholder="例如：用户服务协议"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">简短描述</Label>
                <Textarea
                  id="description"
                  placeholder="简单说明该协议的用途..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              
              {formError && (
                <p className="text-sm font-medium text-destructive">{formError}</p>
              )}

              <Button type="submit" size="lg" className="w-full mt-2 shadow-apple-md" disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {submitting ? '正在保存' : '保存协议'}
              </Button>
            </div>
          </AdminPanel>
          
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2 mb-2">
              Markdown 提示
            </h4>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>使用 <code>#</code> 表示标题</li>
              <li>使用 <code>**文本**</code> 表示加粗</li>
              <li>使用 <code>* 列表项</code> 表示无序列表</li>
              <li>使用 <code>[链接文字](url)</code> 添加链接</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}

function validateForm(form: NewProtocolForm) {
  if (!form.name.trim()) {
    return '请输入协议名称。'
  }

  if (!form.description.trim()) {
    return '请输入协议描述。'
  }

  if (!form.context.trim()) {
    return '请输入协议正文内容。'
  }

  return ''
}
