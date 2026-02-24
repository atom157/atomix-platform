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
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage prompts, monitor usage, and track your AI reply generation.
        </p>
      </div>

      <StatsCards
        plan={profile?.plan || 'trial'}
        used={profile?.generations_count || 0}
        limit={profile?.generations_limit || 20}
      />

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>

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

        <TabsContent value="prompts" className="mt-0">
          <PromptsManager initialPrompts={prompts || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
