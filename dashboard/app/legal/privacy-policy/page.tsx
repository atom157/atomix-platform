import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] text-slate-300 py-20 px-4 sm:px-6 lg:px-8 selection:bg-purple-500/30">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center gap-2 w-fit">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 mt-6 tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-slate-400 mt-4 text-lg">Last updated: February 27, 2026</p>
                </div>

                <div className="space-y-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl">

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p className="leading-relaxed">
                            Welcome to AtomiX. We respect your privacy and are committed to protecting it. This Privacy Policy explains how we collect, use, and safeguard your information when you use our browser extension and web dashboard.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Information We DO NOT Collect</h2>
                        <p className="leading-relaxed mb-4">To ensure maximum privacy and security for our users, AtomiX operates on a principle of data minimization:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-400">
                            <li><strong className="text-white">Passwords & Credentials:</strong> We NEVER collect or store your X (Twitter) passwords or login credentials. Authentication happens via secure OAuth directly with your provider.</li>
                            <li><strong className="text-white">Direct Messages (DMs):</strong> We do not have access to, nor do we read or process, your private messages on any platform.</li>
                            <li><strong className="text-white">Browsing History:</strong> We do not track websites you visit outside of generating replies on the specific X.com tabs where you actively use the extension.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Information We Collect and Process</h2>
                        <p className="leading-relaxed mb-4">We only collect information strictly necessary to provide the core functionality of AtomiX:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-400">
                            <li><strong className="text-white">Publicly Visible Context:</strong> When you click the "Reply with AtomiX" button, the extension temporarily reads the text of the specific public tweet you are replying to. This text is sent to our secure backend API to generate a contractually relevant AI response. This data is not stored permanently.</li>
                            <li><strong className="text-white">Account Information:</strong> We store the email address and profile name provided during the OAuth signup process to manage your AtomiX account and subscription limits.</li>
                            <li><strong className="text-white">Usage Metrics:</strong> We track the number of AI generations you perform to enforce subscription limits (e.g., Free tier limits vs. PRO limits).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Payment Processing & Subscriptions</h2>
                        <p className="leading-relaxed mb-4">
                            All payments and subscriptions for AtomiX PRO are processed securely by our authorized third-party payment provider, <strong>Lava.top</strong>.
                            We do not collect, process, or store your credit card information or primary billing details on our servers. When you upgrade, you are redirected to Lava.top's secure checkout. Lava.top notifies our dashboard via a secure webhook only to confirm your payment success so we can grant you PRO access.
                        </p>
                        <p className="leading-relaxed">
                            <strong>Subscription Cancellation:</strong> You may manage, pause, or cancel your PRO subscription at any time. Because billing is handled externally, all subscription management MUST be performed directly through your Lava.top billing portal: <a href="https://app.lava.top/my-purchases" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">https://app.lava.top/my-purchases</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Refund Policy</h2>
                        <p className="leading-relaxed">
                            AtomiX operates a robust Free tier that provides a generous allocation of replies allowing users to fully test the AI's capabilities prior to purchase. As such, <strong>refunds are generally not issued</strong>. However, we do honor a 14-day refund window strictly under the condition that the user has consumed fewer than twenty (20) AI generations since the time of their PRO upgrade.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Use of Artificial Intelligence</h2>
                        <p className="leading-relaxed">
                            The text context you submit via the extension is processed securely through OpenAI APIs to generate your desired reply. Your input is processed amorphously and is specifically opted out of being used to train any foundational AI models.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Chrome Web Store Disclosures</h2>
                        <p className="leading-relaxed">
                            The AtomiX extension requires the <code>activeTab</code> and <code>host_permissions</code> for `x.com` and `twitter.com`. These permissions are strictly utilized solely to inject the AI UI button into the compose box and to read the text of the tweet you are interacting with. We do not operate on outside domains.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
                        <p className="leading-relaxed">
                            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at support@atomix.guru.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
