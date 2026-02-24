import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon, FileTextIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent({ searchParams }: { searchParams: { message?: string } }) {
  const errorMessage = searchParams.message

  let errorDetails = 'This could happen if the link has expired or has already been used.'
  let showSetupGuide = false

  if (errorMessage?.includes('provider') || errorMessage?.includes('Google')) {
    errorDetails = 'Google OAuth is not configured. Please check SETUP.md for configuration instructions.'
    showSetupGuide = true
  } else if (errorMessage === 'google-not-configured') {
    errorDetails = 'Google OAuth provider is not enabled in your Supabase project.'
    showSetupGuide = true
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircleIcon className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              {errorDetails}
            </p>
            
            {showSetupGuide && (
              <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3">
                <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <FileTextIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Setup Required</p>
                    <p className="text-xs opacity-90 mt-1">
                      See SETUP.md in the project root for detailed instructions on configuring Google OAuth.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">Try email login instead</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/">Go to homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default async function Page({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams
  
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center">
        Loading...
      </div>
    }>
      <ErrorContent searchParams={params} />
    </Suspense>
  )
}
