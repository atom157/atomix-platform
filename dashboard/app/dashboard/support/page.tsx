import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, HelpCircle, FileText, ExternalLink } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
                    Help & Support
                </h1>
                <p className="text-gray-400 mt-3 text-lg font-medium">
                    We're here to help you get the most out of AtomiX.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Contact Channels */}
                <div className="space-y-6">
                    <div className="group bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(42,171,238,0.15)] hover:border-[#2AABEE]/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-[#2AABEE]/10 flex items-center justify-center mb-6 ring-1 ring-[#2AABEE]/20 group-hover:bg-[#2AABEE]/20 transition-colors">
                            <MessageCircle className="w-6 h-6 text-[#2AABEE]" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Telegram Support</h2>
                        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                            Get fast answers directly from our team in our official Telegram support channel. Ideal for quick questions and bug reports.
                        </p>
                        <a
                            href="https://t.me/AtomiX_Support"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#2AABEE] to-[#229ED9] text-white hover:shadow-[0_0_20px_rgba(42,171,238,0.4)] rounded-xl font-bold transition-all text-sm w-full justify-center"
                        >
                            Open Telegram <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="group bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:border-purple-500/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 ring-1 ring-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                            <Mail className="w-6 h-6 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Email Support</h2>
                        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                            For billing inquiries, account recovery, or detailed technical assistance, drop us an email. We typically respond within 24 hours.
                        </p>
                        <a
                            href="mailto:atomix.guru@gmail.com"
                            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl font-bold transition-all text-sm w-full justify-center"
                        >
                            atomix.guru@gmail.com
                        </a>
                    </div>
                </div>

                {/* Policies & FAQ summary */}
                <div className="space-y-6 h-full flex flex-col">

                    <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Refunds & Cancellation</h2>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">Cancellation Policy</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    You can pause or cancel your PRO subscription at absolutely any time. Subscriptions are managed exclusively through our payment provider portal constraint.
                                </p>
                                <a href="https://app.lava.top/my-purchases" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                                    Manage Subscription on Lava.top <span>→</span>
                                </a>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">Refund Policy</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Because AtomiX offers a robust Free tier (allowing you to test the AI exactly as it performs on PRO), we generally do not issue refunds.
                                    However, we offer a 14-day refund window <strong className="text-white">strictly</strong> if you have consumed fewer than 20 AI generations since your upgrade.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0B] border border-purple-500/20 rounded-3xl p-6 backdrop-blur-2xl flex items-start gap-4 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
                        <HelpCircle className="w-6 h-6 text-purple-400 shrink-0 mt-1" />
                        <div>
                            <h3 className="text-sm font-bold text-purple-100 mb-2">Having trouble connecting?</h3>
                            <p className="text-sm text-purple-200/60 leading-relaxed">
                                Ensure you are logged into the dashboard, then click the extension icon and hit the Connect button. If the token fails to sync, try refreshing this page and trying again.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            <div className="flex justify-center gap-8 mt-16 pt-8 border-t border-white/10">
                <Link href="/legal/terms-of-service" className="text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</Link>
                <Link href="/legal/privacy-policy" className="text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</Link>
            </div>

        </div>
    );
}
