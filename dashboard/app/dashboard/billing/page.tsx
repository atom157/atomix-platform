import { createClient } from '@/lib/supabase/server'
import { BillingPlans } from '@/components/dashboard/billing-plans'

export default async function BillingPage() {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .single()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment settings
        </p>
      </div>

      <BillingPlans profile={profile} />
    </div>
  )
}
