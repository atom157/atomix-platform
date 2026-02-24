import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MailIcon } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MailIcon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a confirmation link
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p className="mb-4">
              Click the link in your email to confirm your account and start using X Reply Generator.
            </p>
            <Link
              href="/auth/login"
              className="text-primary underline underline-offset-4"
            >
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
