import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExtensionTokenHandshake } from './token-handshake'

export default async function ExtensionConnectedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/auth/extension-connected')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="text-center flex flex-col items-center gap-4 p-8"
        id="extension-auth-data"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg
            className="h-8 w-8 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Connected!</h1>
        <p className="text-muted-foreground max-w-sm">
          Your account has been connected to the X Reply Generator extension.
        </p>
        <ExtensionTokenHandshake />
      </div>
    </div>
  )
}
