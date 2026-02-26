'use client'

import Link from 'next/link'
import { useState } from 'react'
import { GlassmorphicEngine } from '@/components/landing/GlassmorphicEngine'
import { HowItWorks3D } from '@/components/landing/HowItWorks3D'
/* ─── Feature data ─── */
const features = [
  { title: 'Custom Prompts', desc: 'Create your own voice and style. Define how you want to sound so every reply feels authentic.', icon: '✏️' },
  { title: 'Context Analysis', desc: 'Reads the original tweet, thread, and tone before generating. Your reply always fits the conversation.', icon: '🔍' },
  { title: 'Human-Like Replies', desc: 'No robotic text. AtomiX generates replies that match your personality and feel genuinely human.', icon: '💬' },
  { title: 'One-Click Generation', desc: 'Just click the AtomiX button right inside the X reply box. No tab switching, no copy-pasting.', icon: '⚡' },
  { title: 'Under 2 Seconds', desc: 'Lightning-fast generation powered by GPT-4o. Get your perfectly-tuned reply in a blink.', icon: '⏱️' },
  { title: 'Privacy First', desc: 'Your data stays yours. We never store tweets or personal information. Fully transparent.', icon: '🔒' },
]

const steps = [
  { n: '1', title: 'Install Extension', desc: 'Add AtomiX to Chrome in one click. It integrates directly into the X interface without any clunky popups.' },
  { n: '2', title: 'Set Your Tone', desc: 'Configure custom prompts that match your personality, profession, and unique communication style.' },
  { n: '3', title: 'Reply Instantly', desc: 'Click the AtomiX button directly on any tweet to instantly generate a context-aware, human-like reply.' },
]

const plans = [
  { name: 'Free', price: '$0', period: '/month', desc: 'Perfect for getting started', features: ['20 replies/month', 'Basic prompts', 'Standard generation', 'Custom prompts'], highlighted: false },
  { name: 'Pro', price: '$9', period: '/month', desc: 'For power users on X', features: ['∞ unlimited replies/month', 'Custom prompts', 'Priority generation', 'Analytics dashboard'], highlighted: true },
]

const faqs = [
  { q: 'What is AtomiX?', a: 'AtomiX is a Chrome extension that generates human-like replies on X (Twitter) using AI and your custom prompts. It reads the tweet context and produces a perfectly-tuned response in under 2 seconds.' },
  { q: 'Is it free to use?', a: 'Yes! The free plan includes 20 replies per month. If you need unlimited, you can upgrade to Pro for $9/month.' },
  { q: 'Does it work with other platforms?', a: 'Currently, AtomiX works exclusively with X (Twitter). Support for LinkedIn and other platforms is on our roadmap.' },
  { q: 'How does context analysis work?', a: 'AtomiX reads the original tweet, any conversation thread, and applies your custom prompts to generate a relevant, natural-sounding reply that fits the conversation.' },
  { q: 'Is my data safe?', a: 'Absolutely. We never store tweets or personal information. Your custom prompts are encrypted and only accessible by you.' },
]

/* ─── Main Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-purple-200 font-sans">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-white/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">✨</span>
            </div>
            <span className="font-bold text-xl tracking-tight">AtomiX</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block">Log in</Link>
            <Link href="/auth/sign-up" className="bg-slate-900 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors">Get Extension</Link>
          </div>
        </div>
      </header>

      <main className="relative flex flex-col flex-1">

        {/* ── Hero ── */}
        <section className="relative w-full min-h-screen pt-24 pb-12 flex items-center overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/50 blur-3xl opacity-60 mix-blend-multiply" />
            <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-100/50 blur-3xl opacity-60 mix-blend-multiply" />
          </div>
          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center z-10">
            {/* Left */}
            <div className="flex flex-col items-start gap-8 max-w-xl animate-fade-up">
              <div className="bg-slate-100 text-slate-700 border-none px-4 py-1.5 rounded-full flex gap-2 items-center text-sm font-medium">
                <span className="flex text-yellow-500">{'★★★★★'}</span>
                <span>5.0 Rating | Saves 2+ hours a week</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                  Reply Like You, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Not Like AI</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                  Custom prompts + context analysis = replies that sound human.
                  Read the context and generate perfectly-tuned responses right inside X in under 2 seconds.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
                <Link href="/auth/sign-up" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 rounded-full px-8 h-14 text-base font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Add to Chrome — Free
                </Link>
                <a href="#how-it-works" className="rounded-full px-8 h-14 text-base font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center">
                  View Demo
                </a>
              </div>
            </div>

            <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center animate-fade-up-delay">
              <GlassmorphicEngine />
            </div>
          </div>
        </section>

        <HowItWorks3D />

        {/* ── Pricing ── */}
        <section id="pricing" className="px-6 py-32 bg-white relative">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight">Simple pricing</h2>
              <p className="mt-4 text-lg text-slate-600 font-medium">Choose the plan that fits your workflow. No hidden fees.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <div key={plan.name} className={`relative rounded-3xl p-8 flex flex-col h-full bg-white transition-all duration-300 hover:-translate-y-2 ${plan.highlighted ? 'border-[2px] border-transparent shadow-2xl shadow-purple-500/10 scale-105 z-10' : 'border border-slate-200 shadow-sm'}`}>
                  {plan.highlighted && (
                    <>
                      <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-b from-blue-500 to-purple-600 -z-20">
                        <div className="absolute inset-0 bg-white rounded-[22px] z-[-1]" />
                      </div>
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-xs font-bold text-white shadow-md">Most Popular</div>
                    </>
                  )}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="mt-2 text-[15px] font-medium text-slate-500">{plan.desc}</p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                      <span className="text-[15px] font-semibold text-slate-500">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="mb-8 flex flex-col gap-4 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[15px] font-medium text-slate-600">
                        <div className="mt-0.5 rounded-full bg-blue-50 p-1">
                          <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/sign-up" className={`w-full rounded-full h-12 text-[15px] font-semibold transition-all flex items-center justify-center ${plan.highlighted ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-md shadow-blue-500/20 border-0' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'}`}>
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="px-6 py-32 bg-slate-50/50 relative">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight">Frequently asked questions</h2>
              <p className="mt-4 text-lg text-slate-600 font-medium">Everything you need to know about AtomiX.</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-8">
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} isLast={i === faqs.length - 1} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20">
              <span className="text-white font-bold text-sm">✨</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Atomi<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">X</span>
            </span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/privacy-policy" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Privacy Policy</Link>
            <a href="mailto:support@atomix.guru" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Contact</a>
          </div>
          <p className="text-sm font-medium text-slate-400">&copy; {new Date().getFullYear()} AtomiX. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}

/* ─── Collapsible FAQ item (no external deps) ─── */
function FAQItem({ q, a, isLast }: { q: string; a: string; isLast: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`${isLast ? '' : 'border-b border-slate-100'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-[16px] font-semibold text-slate-900 hover:text-blue-600 transition-colors py-5"
      >
        {q}
        <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-4 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-40 pb-5' : 'max-h-0'}`}>
        <p className="text-[15px] leading-relaxed text-slate-600 font-medium">{a}</p>
      </div>
    </div>
  )
}
