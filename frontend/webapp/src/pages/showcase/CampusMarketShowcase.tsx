import type { AppDetailDto } from '@/types'
import { ArrowLeft, ShoppingBag, Store, MapPin, Sparkles, MessageSquare, TrendingUp, PieChart } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function CampusMarketShowcase({ app }: { app: AppDetailDto }) {
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

      {/* Hero Section - Vibrant Apple/iOS Style */}
      <section className="relative overflow-hidden rounded-[3rem] bg-linear-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-10 lg:p-20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-80 rounded-full bg-purple-500/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold tracking-wider text-foreground backdrop-blur-md border border-white/20 uppercase">
            <Sparkles className="size-4 text-yellow-500" />
            校园生活新方式
          </div>
          <h1 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl">
            {app.name}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {app.description || '让校园闲置流动起来。买你所需，卖你所闲，连接每一个有趣的校园灵魂。'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-14 rounded-full px-10 text-lg font-bold shadow-apple-xl bg-primary hover:bg-primary/90 transition-all hover:scale-105">
              立即逛逛
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full px-10 text-lg font-bold border-2 bg-white/5 backdrop-blur-md">
              发布宝贝
            </Button>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <CategoryCard icon={<ShoppingBag />} label="二手教材" color="bg-blue-500" />
        <CategoryCard icon={<Store />} label="数码产品" color="bg-green-500" />
        <CategoryCard icon={<MapPin />} label="代领快递" color="bg-orange-500" />
        <CategoryCard icon={<MessageSquare />} label="技能交换" color="bg-pink-500" />
      </section>

      {/* Stats & Trends Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        <section className="rounded-[2.5rem] border border-border/60 bg-card/70 p-10 shadow-apple-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="size-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">热门趋势</h2>
            <p className="text-muted-foreground leading-relaxed">
              实时监控校园市场的热搜关键词和高频交易品类，助您快速出手闲置。
            </p>
          </div>
          <div className="mt-8 space-y-4">
             <div className="flex items-center justify-between text-sm">
               <span>iPhone 15 Pro</span>
               <span className="text-primary font-bold">+120%</span>
             </div>
             <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
               <div className="h-full w-3/4 bg-primary rounded-full" />
             </div>
             <div className="flex items-center justify-between text-sm">
               <span>考研资料</span>
               <span className="text-primary font-bold">+85%</span>
             </div>
             <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
               <div className="h-full w-1/2 bg-primary rounded-full" />
             </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-border/60 bg-card/70 p-10 shadow-apple-lg">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <PieChart className="size-5 text-primary" />
              交易占比
            </h3>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">2024 春季学期</span>
          </div>
          <div className="flex items-center justify-center p-4">
             {/* Mock Pie Chart for Bklit style */}
             <div className="relative size-48 rounded-full border-[16px] border-primary/20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[16px] border-transparent border-t-primary border-r-primary rotate-45" />
                <div className="text-center">
                  <span className="block text-3xl font-black">72%</span>
                  <span className="text-[10px] text-muted-foreground uppercase">交易活跃</span>
                </div>
             </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
             <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-primary" />
                <span>电子产品</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-primary/40" />
                <span>生活用品</span>
             </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CategoryCard({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <div className="group cursor-pointer space-y-3 text-center">
      <div className={`mx-auto size-20 rounded-[2rem] ${color} flex items-center justify-center text-white shadow-apple-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-apple-lg group-hover:rotate-3`}>
        {icon}
      </div>
      <span className="block text-sm font-bold tracking-tight">{label}</span>
    </div>
  )
}
