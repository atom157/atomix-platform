'use client'

import React from "react"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  openai_api_key: string | null
  plan: string
}

interface SettingsFormProps {
  user: User
  profile: Profile | null
}

export function SettingsForm({ user, profile }: SettingsFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || user.user_metadata?.full_name || '')
  const [apiKey, setApiKey] = useState(profile?.openai_api_key || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        openai_api_key: apiKey || null,
      })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      router.refresh()
    }

    setIsLoading(false)
  }

  const copyUserId = async () => {
    await navigator.clipboard.writeText(user.id)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button type="submit" className="w-fit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Key</CardTitle>
          <CardDescription>
            Your personal API key for AI generation (optional - uses shared key if not provided)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  OpenAI Dashboard
                </a>
              </p>
            </div>
            <Button type="submit" className="w-fit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save API Key'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extension Settings</CardTitle>
          <CardDescription>
            Use this User ID in your Chrome extension settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={user.id}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyUserId}
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p
          className={`text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-destructive'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
