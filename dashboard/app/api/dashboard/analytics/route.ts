import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // Get usage logs for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: logs } = await supabase
    .from('usage_logs')
    .select('created_at, model, tokens_used')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Aggregate daily usage
  const dailyMap = new Map<string, { count: number; tokens: number }>()
  const modelMap = new Map<string, number>()

  // Pre-fill last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyMap.set(key, { count: 0, tokens: 0 })
  }

  let totalTokens = 0

  for (const log of logs || []) {
    const day = new Date(log.created_at).toISOString().split('T')[0]
    const existing = dailyMap.get(day) || { count: 0, tokens: 0 }
    existing.count += 1
    existing.tokens += log.tokens_used || 0
    dailyMap.set(day, existing)

    const model = log.model || 'gpt-4o-mini'
    modelMap.set(model, (modelMap.get(model) || 0) + 1)

    totalTokens += log.tokens_used || 0
  }

  const dailyUsage = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, data]) => ({
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      replies: data.count,
      tokens: data.tokens,
    }))

  const modelUsage = Array.from(modelMap.entries()).map(([model, count]) => ({
    model,
    count,
  }))

  // Get recent activity (last 10)
  const { data: recentLogs } = await supabase
    .from('usage_logs')
    .select('id, tweet_text, generated_reply, model, tokens_used, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    dailyUsage,
    modelUsage,
    totalReplies: (logs || []).length,
    totalTokens,
    recentActivity: recentLogs || [],
  })
}
