import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, HelpCircle, FileText, ExternalLink } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    Help & Support
                </h1>
                <p className="text-slate-400 mt-2 text-lg">
                    We're here to help you get the most out of AtomiX.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Contact Channels */}
                <div className="space-y-6">
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 backdrop-blur-xl hover:border-purple-500/30 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                            <MessageCircle className="w-6 h-6 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Telegram Support</h2>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Get fast answers directly from our team in our official Telegram support channel. Ideal for quick questions and bug reports.
                        </p>
                        <a
                            href="https://t.me/AtomiX_Support"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2AABEE]/10 text-[#2AABEE] hover:bg-[#2AABEE]/20 rounded-xl font-medium transition-colors text-sm w-full justify-center"
                        >
                            Open Telegram <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 backdrop-blur-xl hover:border-purple-500/30 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                            <Mail className="w-6 h-6 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Email Support</h2>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            For billing inquiries, account recovery, or detailed technical assistance, drop us an email. We typically respond within 24 hours.
                        </p>
                        <a
                            href="mailto:atomix.guru@gmail.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium transition-colors text-sm w-full justify-center"
                        >
                            atomix.guru@gmail.com
                        </a>
                    </div>
                </div>

                {/* Policies & FAQ summary */}
                <div className="space-y-6">

                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-orange-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Refunds & Cancellation</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-200 mb-2">Cancellation Policy</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    You can pause or cancel your PRO subscription at absolutely any time. Subscriptions are managed exclusively through our payment provider portal constraint.
                                </p>
                                <a href="https://app.lava.top/my-purchases" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm text-purple-400 hover:text-purple-300">
                                    Manage Subscription on Lava.top →
                                </a>
                            </div>

                            <div className="h-px w-full bg-white/5"></div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-200 mb-2">Refund Policy</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Because AtomiX offers a robust Free tier (allowing you to test the AI exactly as it performs on PRO), we generally do not issue refunds.
                                    However, we offer a 14-day refund window <strong>strictly</strong> if you have consumed fewer than 20 AI generations since your upgrade.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl flex items-start gap-4">
                        <HelpCircle className="w-6 h-6 text-purple-400 shrink-0 mt-1" />
                        <div>
                            <h3 className="text-sm font-bold text-purple-200 mb-1">Having trouble connecting?</h3>
                            <p className="text-sm text-purple-300/70 leading-relaxed">
                                Ensure you are logged into the dashboard, then click the extension icon and hit the Connect button. If the token fails to sync, try refreshing this page and trying again.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            <div className="flex justify-center gap-6 mt-12 pt-8 border-t border-white/5">
                <Link href="/legal/terms-of-service" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</Link>
                <Link href="/legal/privacy-policy" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</Link>
            </div>

        </div>
    );
}
