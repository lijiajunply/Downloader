import type { AppDetailDto } from '@/types'
import { ArrowLeft, BookOpen, GraduationCap, Users, Star, CheckCircle2, BarChart3 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function CourseAppShowcase({ app }: { app: AppDetailDto }) {
  return (
    <div className="space-y-20 pb-20">
      {/* Navigation */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground/70 transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        返回首页
      </Link>

      {/* Hero Section - Apple Style */}
      <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-wider text-primary uppercase">
            专业在线教育方案
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            {app.name}
          </h1>
          <p className="max-w-xl mx-auto lg:mx-0 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {app.description || '重新定义您的学习体验。随时随地，开启知识的大门。专为现代教育设计的全方位解决方案。'}
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Button size="lg" className="h-14 rounded-2xl px-8 text-lg font-semibold shadow-apple-lg transition-all hover:scale-105">
              立即开始学习
            </Button>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="size-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="avatar" />
                </div>
              ))}
              <div className="size-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                +2k
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-xl relative">
          <div className="aspect-square rounded-[3rem] bg-linear-to-br from-primary/20 to-primary/5 p-8 shadow-apple-2xl">
             <div className="h-full w-full rounded-[2rem] bg-card/80 backdrop-blur-xl border border-border/50 p-6 flex flex-col justify-between shadow-apple-lg">
                <div className="flex items-center justify-between">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <GraduationCap className="size-6" />
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="size-4 fill-primary text-primary" />)}
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="h-4 w-3/4 bg-muted rounded-full" />
                   <div className="h-4 w-1/2 bg-muted/60 rounded-full" />
                   <div className="pt-4 grid grid-cols-2 gap-4">
                      <div className="h-20 rounded-2xl bg-secondary/50 flex flex-col items-center justify-center p-2">
                         <span className="text-xl font-bold">85%</span>
                         <span className="text-[10px] text-muted-foreground">完成率</span>
                      </div>
                      <div className="h-20 rounded-2xl bg-secondary/50 flex flex-col items-center justify-center p-2">
                         <span className="text-xl font-bold">128</span>
                         <span className="text-[10px] text-muted-foreground">课程数</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<BookOpen className="size-6" />}
          title="海量课程资源"
          description="涵盖 IT、商业、艺术等多个领域，满足不同阶段的学习需求。"
        />
        <FeatureCard
          icon={<Users className="size-6" />}
          title="互动社区"
          description="与全球学习者交流心得，解决疑难问题，共同进步。"
        />
        <FeatureCard
          icon={<CheckCircle2 className="size-6" />}
          title="官方认证证书"
          description="完成课程后可获得由权威机构颁发的结业证书，助力职场进阶。"
        />
      </section>

      {/* Data Section with Mock Bklit Chart */}
      <section className="rounded-[2.5rem] border border-border/60 bg-card/50 p-10 lg:p-16 shadow-apple-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">数据驱动的学习轨迹</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              通过详细的学习分析，掌握您的进步曲线。每一分钟的努力，都清晰可见。
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-primary" />
                <span>实时追踪学习进度</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-primary" />
                <span>个性化学习建议</span>
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full bg-background/40 rounded-3xl p-8 border border-border/40 shadow-apple-sm">
             <div className="flex items-center justify-between mb-8">
               <h3 className="font-semibold flex items-center gap-2">
                 <BarChart3 className="size-4 text-primary" />
                 学习活跃度
               </h3>
               <span className="text-xs text-muted-foreground">最近 30 天</span>
             </div>
             {/* Mock Chart using Tailwind to simulate Bklit/Apple style */}
             <div className="flex items-end justify-between h-48 gap-2">
                {[40, 60, 45, 90, 65, 80, 50, 70, 85, 40, 60, 75].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-full rounded-t-lg bg-linear-to-t from-primary/80 to-primary/40 transition-all hover:opacity-80"
                  />
                ))}
             </div>
             <div className="mt-4 flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
               <span>Jan</span>
               <span>Feb</span>
               <span>Mar</span>
             </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group rounded-[2rem] border border-border/50 bg-card/60 p-8 shadow-apple-sm transition-all duration-300 hover:shadow-apple-md hover:-translate-y-1">
      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
