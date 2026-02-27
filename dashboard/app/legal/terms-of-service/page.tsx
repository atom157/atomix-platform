import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] text-slate-300 py-20 px-4 sm:px-6 lg:px-8 selection:bg-purple-500/30">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center gap-2 w-fit">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 mt-6 tracking-tight">
                        Terms of Service
                    </h1>
                    <p className="text-slate-400 mt-4 text-lg">Last updated: February 27, 2026</p>
                </div>

                <div className="space-y-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl">

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="leading-relaxed">
                            By accessing, downloading, or using the AtomiX browser extension and web platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access or use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                        <p className="leading-relaxed">
                            AtomiX is an AI-powered writing assistant specifically designed to generate contextual, human-like replies for the X (Twitter) platform. It operates as a browser extension that interfaces with our cloud API to process selected text and return suggested responses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Acceptable Use Policy</h2>
                        <p className="leading-relaxed mb-4">You agree not to use the AtomiX service for any unlawful or prohibited activities. Specifically, you agree NOT to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-400">
                            <li><strong className="text-white">Generate Spam:</strong> You may not use AtomiX to mass-generate automated, repetitive, or irrelevant replies with the intent to manipulate platform algorithms or harass other users.</li>
                            <li><strong className="text-white">Bot Operations:</strong> You may not hook AtomiX into automated bot networks. The extension is designed explicitly for human-in-the-loop assistance.</li>
                            <li><strong className="text-white">Illegal Content:</strong> You may not use the AI to generate or promote hate speech, illegal acts, self-harm, adult content, or harassment.</li>
                            <li><strong className="text-white">API Abuse:</strong> You may not reverse-engineer the extension to extract our private API endpoints or attempt to bypass subscription rate limits.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Subscriptions and Payments</h2>
                        <p className="leading-relaxed">
                            AtomiX offers a "PRO" tier that provides unlimited generations. Payments are processed securely via our trusted third-party provider, Lava.top.
                            All subscriptions are subject to our cancellation policy. You may manage or cancel your subscription at any time via the AtomiX web dashboard or your Lava.top account. We reserve the right to suspend accounts that initiate fraudulent chargebacks.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Disclaimer of Warranties</h2>
                        <p className="leading-relaxed">
                            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for accuracy, the AI-generated responses from AtomiX are suggestions. You are solely responsible for reviewing and editing the content before posting it to any public forum. We do not warrant that the AI will always produce error-free or perfectly context-aware results.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Changes to Terms</h2>
                        <p className="leading-relaxed">
                            We reserve the right to modify or replace these Terms at any time. Material changes will be communicated via the email address associated with your account or a prominent notice on our website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Contact</h2>
                        <p className="leading-relaxed">
                            For any legal inquiries or support relating to these terms, contact support@atomix.guru.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
