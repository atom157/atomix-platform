import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | AtomiX',
    description: 'Privacy Policy for AtomiX Chrome Extension and Web App',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-purple-200 font-sans">
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-white/70 border-b border-slate-100">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/">
                        <Logo />
                    </Link>
                    <nav className="flex items-center gap-8 text-sm font-medium text-slate-600">
                        <Link href="/#features" className="hover:text-slate-900 transition-colors">Features</Link>
                        <Link href="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 pt-32 pb-24 px-6 max-w-3xl mx-auto w-full">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-8">Privacy Policy</h1>

                <div className="prose prose-slate prose-lg max-w-none">
                    <p className="text-slate-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Data Collection</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We respect your privacy and actively minimize the data AtomiX collects. When you use the extension, we only collect the text of the tweet you select to generate a reply. We do not track your browsing history or collect any other content from your X/Twitter feed.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. AI Processing</h2>
                        <p className="text-slate-600 leading-relaxed">
                            To generate high-quality replies, your selected tweet context is processed securely via OpenAI and Anthropic APIs. This data is transmitted securely and is <strong>NOT</strong> used for training AI models unless explicitly stated otherwise, abiding by the zero-data-retention agreements for enterprise API customers.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Analytics</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use PostHog to collect strictly anonymous behavioral analytics (such as page views and button clicks) to understand how AtomiX is used and to improve the product. We explicitly configure this tracking to <strong>never capture IP addresses</strong>, ensuring your activity cannot be traced back to you.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Third Parties</h2>
                        <p className="text-slate-900 leading-relaxed font-semibold">
                            We do NOT sell or share user data with third parties.
                        </p>
                        <p className="text-slate-600 leading-relaxed mt-2">
                            Your personal data and generated content are never rented, sold, or shared for advertising or profiling purposes.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Storage</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use Supabase to securely store your account details, custom prompts, and extension settings. All sensitive data is encrypted at rest and in transit.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. User Rights & Deletion</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You maintain full control over your data. You can delete your account and all associated data at any time directly via the AtomiX web dashboard. Once deleted, this action cannot be undone and your data is immediately purged from our servers.
                        </p>
                    </section>

                </div>
            </main>

            <footer className="border-t border-slate-100 bg-white px-6 py-12 mt-auto">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Logo className="scale-110 origin-left" />
                        </Link>
                    </div>
                    <div className="flex items-center gap-8">
                        <Link href="/privacy" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Privacy Policy</Link>
                        <a href="mailto:support@atomix.guru" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Contact</a>
                    </div>
                    <p className="text-sm font-medium text-slate-400">&copy; {new Date().getFullYear()} AtomiX. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
