import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Both webhook secrets — "Payment result" and "Recurring payment" types
const VALID_SECRETS = [
    process.env.LAVA_WEBHOOK_SECRET_RESULT,
    process.env.LAVA_WEBHOOK_SECRET_RECURRING,
].filter(Boolean) as string[]

export async function POST(request: Request) {
    try {
        // ── Auth: verify X-Api-Key matches one of our webhook secrets ──────
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey || !VALID_SECRETS.includes(apiKey)) {
            console.error('[LAVA-WH] Invalid or missing X-Api-Key')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { eventType, buyer, contractId, clientUtm, status, parentContractId } = body

        console.log('[LAVA-WH] Event:', eventType, '| Status:', status, '| Contract:', contractId)

        const supabase = getSupabaseAdmin()

        // ── Extract user ID from clientUtm.utm_content (set during invoice creation) ──
        const userId = clientUtm?.utm_content || null
        const buyerEmail = buyer?.email || null

        // ── Handle events ──────────────────────────────────────────────────
        switch (eventType) {
            // ── First payment success (product purchase or first subscription payment) ──
            case 'payment.success': {
                if (!userId && !buyerEmail) {
                    console.error('[LAVA-WH] No user identifier in payment.success')
                    return NextResponse.json({ received: true })
                }

                const now = new Date()
                const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days

                const updateData = {
                    plan: 'pro',
                    subscription_status: 'active',
                    generations_limit: 999999,
                    lava_contract_id: contractId,
                    cancel_at_period_end: false,
                    current_period_end: periodEnd.toISOString(),
                }

                let error
                if (userId) {
                    const result = await supabase.from('profiles').update(updateData).eq('id', userId)
                    error = result.error
                } else {
                    // Fallback: match by email via auth.users
                    const { data: users } = await supabase.auth.admin.listUsers()
                    const matchedUser = users?.users?.find(u => u.email === buyerEmail)
                    if (matchedUser) {
                        const result = await supabase.from('profiles').update(updateData).eq('id', matchedUser.id)
                        error = result.error
                    } else {
                        console.error('[LAVA-WH] No user found for email:', buyerEmail)
                    }
                }

                if (error) {
                    console.error('[LAVA-WH] Profile update failed:', error.message)
                } else {
                    console.log('[LAVA-WH] ✅ User upgraded to Pro:', userId || buyerEmail)
                }
                break
            }

            case 'subscription.recurring.payment.success': {
                // Successful renewal: reset usage, extend billing period, clear cancel flag
                const contractToMatch = parentContractId || contractId
                const renewalPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                const { error } = await supabase
                    .from('profiles')
                    .update({
                        generations_count: 0,
                        subscription_status: 'active',
                        plan: 'pro',
                        generations_limit: 999999,
                        cancel_at_period_end: false,
                        current_period_end: renewalPeriodEnd.toISOString(),
                    })
                    .eq('lava_contract_id', contractToMatch)

                if (error) {
                    console.error('[LAVA-WH] Recurring reset failed:', error.message)
                } else {
                    console.log('[LAVA-WH] ✅ Monthly usage reset + period extended for contract:', contractToMatch)
                }
                break
            }

            case 'subscription.cancelled': {
                // DON'T downgrade immediately — user paid for the current period.
                // Mark for downgrade at period end. willExpireAt comes from Lava.top.
                const cancelContractId = contractId
                const willExpireAt = body.willExpireAt || null

                const cancelUpdate: Record<string, unknown> = {
                    cancel_at_period_end: true,
                    subscription_status: 'cancelled',
                }
                // If Lava.top provides the expiration date, store it
                if (willExpireAt) {
                    cancelUpdate.current_period_end = willExpireAt
                }

                const { error } = await supabase
                    .from('profiles')
                    .update(cancelUpdate)
                    .eq('lava_contract_id', cancelContractId)

                if (error) {
                    console.error('[LAVA-WH] Cancellation update failed:', error.message)
                } else {
                    console.log('[LAVA-WH] ✅ Subscription marked for cancellation at period end:', willExpireAt || 'unknown', '| Contract:', cancelContractId)
                }
                break
            }

            // ── Failed payments — log only ──
            case 'payment.failed':
            case 'subscription.recurring.payment.failed': {
                console.warn('[LAVA-WH] ⚠️ Payment failed:', eventType, '| Email:', buyerEmail, '| Error:', body.errorMessage)
                break
            }

            default:
                console.log('[LAVA-WH] Unknown event type:', eventType)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[LAVA-WH] Webhook handler error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
