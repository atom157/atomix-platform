import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Privacy Policy - X Reply Generator',
  description: 'Privacy policy for the X Reply Generator Chrome Extension',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </a>
            </Button>
            <h1 className="text-lg font-semibold">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground">
            Last updated: February 10, 2026
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
          <p className="leading-relaxed text-foreground/90">
            X Reply Generator (&quot;the Extension&quot;) is a Chrome browser extension that
            helps users generate AI-powered replies to posts on X/Twitter. This
            Privacy Policy explains what data we collect, how we use it, and
            your rights regarding that data.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Data We Collect</h2>

          <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Account Data</h3>
          <p className="leading-relaxed text-foreground/90">
            When you create an account through Google OAuth or email/password,
            we store your email address, display name, and a unique user
            identifier. This data is stored securely in our Supabase database.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Tweet Content (Transient)</h3>
          <p className="leading-relaxed text-foreground/90">
            When you click &quot;Generate Reply,&quot; the Extension reads the
            text of the tweet you are replying to, the author name, handle,
            and up to 5 preceding thread messages. This content is sent to our
            server solely to generate a reply via the OpenAI API. We store a
            truncated version of the tweet text and the generated reply in our
            usage log for analytics and abuse prevention.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">2.3 Extension Settings</h3>
          <p className="leading-relaxed text-foreground/90">
            Your chosen tone, language, length preferences, custom prompts,
            and banned-word lists are stored in your account on our servers so
            they sync across devices. If you supply your own OpenAI API key,
            it is stored encrypted in your profile and is never shared with
            third parties.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">2.4 Usage Metrics</h3>
          <p className="leading-relaxed text-foreground/90">
            We track the number of replies generated, the AI model used, and
            token counts to enforce plan limits and display analytics in your
            dashboard.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">2.5 Payment Data</h3>
          <p className="leading-relaxed text-foreground/90">
            Payments are processed by LemonSqueezy. We never see or store your
            credit card number. We receive your customer ID and subscription
            status from LemonSqueezy webhooks to manage your plan.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2 text-foreground/90">
            <li>To generate AI replies on your behalf via the OpenAI API.</li>
            <li>To authenticate you and manage your account.</li>
            <li>To enforce usage limits based on your subscription plan.</li>
            <li>To improve the quality and performance of the service.</li>
            <li>To detect and prevent abuse or unauthorized access.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Third-Party Services</h2>
          <ul className="list-disc pl-6 space-y-2 text-foreground/90">
            <li>
              <strong>OpenAI</strong> &mdash; tweet content is sent to OpenAI&apos;s API
              to generate replies. See{' '}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                OpenAI&apos;s Privacy Policy
              </a>.
            </li>
            <li>
              <strong>Supabase</strong> &mdash; hosts our database and
              authentication system.
            </li>
            <li>
              <strong>LemonSqueezy</strong> &mdash; processes subscription
              payments.
            </li>
            <li>
              <strong>Vercel</strong> &mdash; hosts the web application and
              collects anonymous analytics.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Retention</h2>
          <p className="leading-relaxed text-foreground/90">
            Usage logs are retained for 90 days and then automatically deleted.
            Account data is retained as long as your account is active. You may
            request full deletion of your data at any time (see Section 7).
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Data Security</h2>
          <p className="leading-relaxed text-foreground/90">
            All communication between the Extension, our servers, and
            third-party APIs is encrypted via TLS. Extension authentication
            uses cryptographically random tokens with server-side SHA-256
            hashing. Database access is protected by Row Level Security (RLS)
            policies.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Your Rights</h2>
          <p className="leading-relaxed text-foreground/90">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/90">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and all associated data.</li>
            <li>Export your data in a machine-readable format.</li>
          </ul>
          <p className="leading-relaxed text-foreground/90 mt-3">
            To exercise any of these rights, contact us at the email address
            listed in Section 9.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Changes to This Policy</h2>
          <p className="leading-relaxed text-foreground/90">
            We may update this Privacy Policy from time to time. Changes will
            be posted on this page with an updated &quot;Last updated&quot; date. Continued
            use of the Extension after changes constitutes acceptance of the
            updated policy.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Contact</h2>
          <p className="leading-relaxed text-foreground/90">
            If you have questions about this Privacy Policy or wish to exercise
            your data rights, please contact us through the dashboard or email
            us at the address listed in the Chrome Web Store listing.
          </p>
        </article>
      </main>

      <footer className="border-t border-border/40 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          X Reply Generator - Open Source Chrome Extension
        </div>
      </footer>
    </div>
  )
}
