import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AtomiX
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16 md:pt-32 md:pb-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Trusted by 500+ creators on X
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          <span className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            AI-Powered Replies
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            for X (Twitter)
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          AtomiX reads the tweet, understands the context, and generates a
          perfectly-tuned human-like reply in under 2 seconds. Right inside X —
          no switching tabs.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          {user ? (
            <Link
              href="/dashboard"
              className="px-8 py-3.5 text-base font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-up"
                className="px-8 py-3.5 text-base font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started — It&apos;s Free
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-3.5 text-base font-semibold rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <FeatureCard
            icon="⚡"
            title="Under 2 Seconds"
            desc="Generate human-like replies instantly with one click."
          />
          <FeatureCard
            icon="🎯"
            title="Custom Prompts"
            desc="Create, save, and switch between unlimited prompt styles."
          />
          <FeatureCard
            icon="🔒"
            title="Privacy First"
            desc="Your data stays yours. No tweet data is stored."
          />
        </div>
      </main>

      {/* How it works */}
      <section className="relative z-10 py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard step="1" title="Install Extension" desc="Add AtomiX to Chrome — takes 10 seconds." />
            <StepCard step="2" title="Open Any Tweet" desc="An 'AtomiX Reply' button appears below every tweet." />
            <StepCard step="3" title="One Click Reply" desc="AI reads the context and generates a natural reply." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-500">
            © {new Date().getFullYear()} AtomiX. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all backdrop-blur-sm">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <span className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-bold shadow-lg">
        {step}
      </span>
      <h3 className="text-base font-semibold text-white mb-2 mt-1">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  )
}
