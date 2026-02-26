'use client'

import Link from 'next/link'
import { useState } from 'react'
import { GlassmorphicEngine } from '@/components/landing/GlassmorphicEngine'
import { HowItWorks3D } from '@/components/landing/HowItWorks3D'
import { Pricing3D } from '@/components/landing/Pricing3D'
import { Logo } from '@/components/ui/logo'
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

const ChromeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="chrome-a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#d93025" />
        <stop offset="1" stopColor="#ea4335" />
      </linearGradient>
      <linearGradient id="chrome-b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fcc934" />
        <stop offset="1" stopColor="#fbbc04" />
      </linearGradient>
      <linearGradient id="chrome-c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1e8e3e" />
        <stop offset="1" stopColor="#34a853" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="23.9947" r="12" fill="#fff" />
    <path d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z" fill="none" />
    <path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" fill="url(#chrome-a)" />
    <circle cx="24" cy="24" r="9.5" fill="#1a73e8" />
    <path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" fill="url(#chrome-b)" />
    <path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" fill="url(#chrome-c)" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-purple-200 font-sans">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-white/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block">Log in</Link>
            <Link href="/auth/sign-up" className="group bg-slate-900 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <ChromeIcon className="w-[14px] h-[14px] transition-transform duration-300 group-hover:scale-[1.15]" />
              Get Extension
            </Link>
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
                <Link href="/auth/sign-up" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 rounded-full px-8 h-14 text-base font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <ChromeIcon className="w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-[1.12]" />
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

        {/* ── Features ── */}
        <section id="features" className="px-6 py-32 bg-white relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight">Everything you need</h2>
              <p className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto">Powerful features that make your X replies stand out, engineered for speed and authenticity.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="group relative rounded-3xl border border-slate-100 bg-white/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 hover:border-slate-200">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 text-2xl shadow-inner border border-blue-100/50 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-600 font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks3D />

        {/* ── Pricing ── */}
        <Pricing3D />

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
            <Logo className="scale-110 origin-left" />
          </div>
          <div className="flex items-center gap-8">
            <Link href="/privacy" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Privacy Policy</Link>
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
