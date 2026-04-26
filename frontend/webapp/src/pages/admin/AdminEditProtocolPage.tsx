import { useState, type FormEvent, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, BookText, LoaderCircle, Save, Eye, Edit3, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { getProtocol, updateProtocol } from '@/services'
import { AdminPageHeader } from './AdminShared'
import { getAdminErrorMessage } from './adminUtils'
import { useAdminAuthFailure } from './useAdminAuthFailure'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="size-10 animate-spin text-primary opacity-20" />
          <p className="text-sm text-muted-foreground animate-pulse">正在加载协议详情...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      <AdminPageHeader
        eyebrow={
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <BookText className="size-3.5" />
            协议管理
          </Badge>
        }
        title="编辑协议"
        description="修改应用的法律声明、用户协议或隐私政策。支持标准的 Markdown 格式。"
        action={
          <Button asChild variant="ghost" className="rounded-xl group">
            <Link to={`/admin/apps/${appId}`}>
              <ArrowLeft className="size-4 mr-2 transition-transform group-hover:-translate-x-1" />
              取消并返回
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[1.5rem] border-border/60 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">协议内容</CardTitle>
                  <CardDescription>使用 Markdown 编写协议的正文内容</CardDescription>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                  <TabsList className="grid w-full grid-cols-2 h-9 rounded-lg">
                    <TabsTrigger value="edit" className="text-xs gap-1.5">
                      <Edit3 className="size-3" />
                      编辑
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs gap-1.5">
                      <Eye className="size-3" />
                      预览
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="edit" className="mt-0 border-none ring-0 focus-visible:ring-0">
                  <Textarea
                    id="context"
                    placeholder="在这里输入协议正文，支持 Markdown..."
                    className="min-h-[600px] border-none rounded-none font-mono leading-relaxed p-6 focus-visible:ring-0 resize-none text-base"
                    value={form.context}
                    onChange={(e) => setForm({ ...form, context: e.target.value })}
                  />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-0 p-6">
                  <div className="min-h-[600px] prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed">
                    <ReactMarkdown>{form.context}</ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[1.5rem] border-border/60 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="text-xl">基本信息</CardTitle>
              <CardDescription>设置协议的展示名称和简短介绍</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">协议名称</Label>
                <Input
                  id="name"
                  placeholder="例如：用户服务协议"
                  className="rounded-xl h-11"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">简短描述</Label>
                <Textarea
                  id="description"
                  placeholder="简单说明该协议的用途..."
                  rows={4}
                  className="rounded-xl resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              
              {formError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium p-3 rounded-lg">
                  {formError}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full h-12 rounded-xl shadow-lg shadow-primary/20" disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {submitting ? '正在保存...' : '保存修改'}
              </Button>
            </CardContent>
          </Card>
          
          <div className="p-6 rounded-[1.5rem] bg-muted/30 border border-border/50 space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Info className="size-4 text-primary" />
              Markdown 快捷指南
            </h4>
            <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground font-mono">
              <div className="bg-background/50 p-2 rounded-lg border border-border/30">
                # 标题 1<br/>
                ## 标题 2
              </div>
              <div className="bg-background/50 p-2 rounded-lg border border-border/30">
                **加粗文本**<br/>
                *斜体文本*
              </div>
              <div className="bg-background/50 p-2 rounded-lg border border-border/30">
                - 列表项 1<br/>
                - 列表项 2
              </div>
              <div className="bg-background/50 p-2 rounded-lg border border-border/30">
                [链接文字](url)<br/>
                {">"} 引用块
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
