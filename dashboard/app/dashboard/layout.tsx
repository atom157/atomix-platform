import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/dashboard')
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-purple-200 font-sans relative overflow-hidden">
      {/* Soft Background Gradient matching Landing Page/Popup */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.08)_0%,transparent_100%)] z-0" />

      <div className="relative z-10">
        <DashboardNav user={user} />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
