import { createClient } from '@/lib/supabase/server'
import { PromptsManager } from '@/components/dashboard/prompts-manager'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { UsageChart } from '@/components/dashboard/usage-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: prompts } = await supabase
    .from('prompts')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generations_count, generations_limit')
    .single()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage prompts, monitor usage, and track your AI reply generation.
        </p>
      </div>

      <StatsCards
        plan={profile?.plan || 'trial'}
        used={profile?.generations_count || 0}
        limit={profile?.generations_limit || 20}
      />

      <Tabs defaultValue="prompts" className="flex flex-col gap-4">
        <TabsList className="w-fit bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1 border border-slate-200/50 shadow-sm">
          <TabsTrigger
            value="prompts"
            className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-500 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20"
          >
            Prompts
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-500 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20"
          >
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="mt-0">
          <PromptsManager initialPrompts={prompts || []} />
        </TabsContent>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <UsageChart />
            </div>
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
