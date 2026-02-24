import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/dashboard/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .single()

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and API settings
        </p>
      </div>

      <SettingsForm user={user!} profile={profile} />
    </div>
  )
}
