'use client'

import useSWR from 'swr'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ActivityItem {
  id: string
  tweet_text: string | null
  generated_reply: string | null
  model: string
  tokens_used: number
  created_at: string
}

interface AnalyticsData {
  recentActivity: ActivityItem[]
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RecentActivity() {
  const { data, isLoading } = useSWR<AnalyticsData>(
    '/api/dashboard/analytics',
    fetcher,
    { refreshInterval: 60000 }
  )

  return (
    <Card className="rounded-3xl border border-slate-100 bg-white/60 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-900">Recent Activity</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">Your latest generated replies</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-white/50 rounded-xl">
                <Skeleton className="h-4 w-3/4 bg-slate-100" />
                <Skeleton className="h-3 w-1/2 bg-slate-100" />
              </div>
            ))}
          </div>
        ) : !data?.recentActivity?.length ? (
          <div className="flex flex-col items-center justify-center py-10">
            <MessageSquare className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium text-center">
              No activity yet. Use the Chrome extension to generate your first reply!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[380px] pr-4">
            <div className="flex flex-col gap-3">
              {data.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5"
                >
                  {item.tweet_text && (
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide line-clamp-1">
                      Replying to: <span className="text-slate-500 normal-case font-medium">{item.tweet_text}</span>
                    </p>
                  )}
                  {item.generated_reply && (
                    <p className="text-[15px] font-medium text-slate-700 leading-relaxed line-clamp-2">
                      {item.generated_reply}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100/50">
                    <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-none font-bold">
                      {item.model.replace('gpt-', 'GPT-')}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400">
                      {item.tokens_used} tokens
                    </span>
                    <span className="text-xs font-semibold text-slate-400 ml-auto uppercase tracking-wider">
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
