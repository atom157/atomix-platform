import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, HelpCircle, FileText, ExternalLink, Sparkles } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 px-4">

            {/* HERO SUPPORT SECTION */}
            <div className="text-center pt-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2AABEE]/10 ring-1 ring-[#2AABEE]/20 mb-6 shadow-[0_0_40px_rgba(42,171,238,0.2)]">
                    <MessageCircle className="w-10 h-10 text-[#2AABEE]" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight mb-4">
                    Need help with AtomiX?
                </h1>
                <p className="text-gray-400 text-lg sm:text-xl font-medium max-w-xl mx-auto mb-10 leading-relaxed">
                    We're here to get you unstuck. Reach out to our Telegram support team for fast, human assistance.
                </p>

                {/* PRIMARY CTA */}
                <div className="max-w-md mx-auto">
                    <a
                        href="https://t.me/AtomiX_Support"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-flex items-center justify-center gap-3 w-full px-8 py-5 bg-gradient-to-r from-[#2AABEE] to-[#229ED9] text-white rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(42,171,238,0.4)] hover:shadow-[0_0_60px_rgba(42,171,238,0.6)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <MessageCircle className="w-6 h-6 relative z-10" />
                        <span className="relative z-10">Chat with Support</span>
                        <ExternalLink className="w-5 h-5 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
                        <Sparkles className="w-4 h-4 text-amber-400/70" />
                        <p>Real humans. Average response time: <span className="text-gray-300">3–10 minutes</span>.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-12">

                {/* Secondary Action: Email */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                        Prefer email? Drop us a line at
                        <a href="mailto:atomix.guru@gmail.com" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                            <Mail className="w-3.5 h-3.5" /> atomix.guru@gmail.com
                        </a>
                    </p>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Friendly Troubleshooting Block */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left transition-colors hover:bg-white/[0.03]">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
                        <span className="text-xl">💡</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white mb-2 tracking-tight">Quick Fix: Having trouble connecting?</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Ensure you are logged into the dashboard, then click the extension icon and hit the Connect button. If the token fails to sync, try refreshing this page and trying again.
                        </p>
                    </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Demoted Legal & Policy Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 mb-6 justify-center sm:justify-start">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-bold text-gray-300 tracking-tight">Policies & Billing</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-colors">
                            <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Cancellation</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                You can pause or cancel your PRO subscription at absolutely any time through our payment provider portal.
                            </p>
                            <a href="https://app.lava.top/my-purchases" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                                Manage Subscription <span>→</span>
                            </a>
                        </div>

                        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-colors">
                            <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Refunds</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Due to our robust Free tier, refunds are generally not issued. We offer a 14-day refund window <strong className="text-gray-400">strictly</strong> if you have consumed fewer than 20 AI generations since upgrading.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Links */}
            <div className="flex justify-center gap-8 mt-16 pt-8 border-t border-white/5">
                <Link href="/legal/terms-of-service" className="text-xs font-medium text-gray-600 hover:text-gray-400 transition-colors">Terms of Service</Link>
                <Link href="/legal/privacy-policy" className="text-xs font-medium text-gray-600 hover:text-gray-400 transition-colors">Privacy Policy</Link>
            </div>

        </div>
    );
}
