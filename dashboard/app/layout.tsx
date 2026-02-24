import React from "react"
import type { Metadata, Viewport } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const _geistMono = Geist_Mono({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: 'AtomiX — AI-Powered Replies for X (Twitter)',
  description: 'AtomiX reads the tweet, understands the context, and generates a perfectly-tuned human-like reply in under 2 seconds. Right inside X — no switching tabs.',
  keywords: ['AtomiX', 'X replies', 'Twitter AI', 'Chrome extension', 'AI replies', 'GPT-4o', 'social media automation'],
  openGraph: {
    title: 'AtomiX — AI-Powered Replies for X (Twitter)',
    description: 'One click. Human-like reply. Instant engagement.',
    siteName: 'AtomiX',
    url: 'https://atomix.guru',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AtomiX — AI-Powered Replies for X (Twitter)',
    description: 'One click. Human-like reply. Instant engagement.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a1a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
