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

        // Log the ENTIRE raw payload so we can debug field paths
        console.log('[LAVA-WH] ===== RAW PAYLOAD =====')
        console.log(JSON.stringify(body, null, 2))
        console.log('[LAVA-WH] ========================')

        const { eventType, buyer, contractId, clientUtm, status, parentContractId } = body

        console.log('[LAVA-WH] Event:', eventType, '| Status:', status, '| Contract:', contractId)
        console.log('[LAVA-WH] clientUtm:', JSON.stringify(clientUtm))
        console.log('[LAVA-WH] buyer:', JSON.stringify(buyer))

        const supabaseAdmin = getSupabaseAdmin()

        // ── Extract user ID from clientUtm.utm_content (set during invoice creation) ──
        const userId = clientUtm?.utm_content || null
        const buyerEmail = buyer?.email || null

        console.log('[LAVA-WH] Extracted userId:', userId)
        console.log('[LAVA-WH] Extracted buyerEmail:', buyerEmail)

        // ── Handle events ──────────────────────────────────────────────────
        switch (eventType) {
            // ── First payment success ──
            case 'payment.success': {
                if (!userId && !buyerEmail) {
                    console.error('[LAVA-WH] ❌ No user identifier in payment.success — cannot update')
                    return NextResponse.json({ received: true })
                }

                // Only update columns that definitely exist
                const updateData: Record<string, unknown> = {
                    plan: 'pro',
                    subscription_status: 'active',
                    generations_limit: 999999,
                    lava_contract_id: contractId,
                }

                console.log('[LAVA-WH] Target User ID:', userId)
                console.log('[LAVA-WH] Update data:', JSON.stringify(updateData))

                if (userId) {
                    // Primary path: update by Supabase user.id
                    const result = await supabaseAdmin
                        .from('profiles')
                        .update(updateData)
                        .eq('id', userId)
                        .select()

                    console.log('[LAVA-WH] Update result data:', JSON.stringify(result.data))
                    console.log('[LAVA-WH] Update result error:', JSON.stringify(result.error))
                    console.log('[LAVA-WH] Update result count:', result.data?.length ?? 0)

                    if (result.error) {
                        console.error('[LAVA-WH] ❌ Profile update FAILED:', result.error.message, '| Code:', result.error.code)
                    } else if (!result.data || result.data.length === 0) {
                        console.error('[LAVA-WH] ❌ No rows matched userId:', userId, '— profile row may not exist')
                    } else {
                        console.log('[LAVA-WH] ✅ User upgraded to Pro! userId:', userId, '| Updated plan:', result.data[0]?.plan)
                    }
                } else {
                    // Fallback: match by email via auth.users
                    console.log('[LAVA-WH] No userId, trying email fallback:', buyerEmail)
                    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
                    const matchedUser = users?.users?.find((u: { email?: string }) => u.email === buyerEmail)

                    if (matchedUser) {
                        console.log('[LAVA-WH] Found user by email. ID:', matchedUser.id)
                        const result = await supabaseAdmin
                            .from('profiles')
                            .update(updateData)
                            .eq('id', matchedUser.id)
                            .select()

                        console.log('[LAVA-WH] Email fallback result:', JSON.stringify(result.data), '| Error:', JSON.stringify(result.error))

                        if (result.error) {
                            console.error('[LAVA-WH] ❌ Email fallback update FAILED:', result.error.message)
                        } else {
                            console.log('[LAVA-WH] ✅ User upgraded to Pro via email! ID:', matchedUser.id)
                        }
                    } else {
                        console.error('[LAVA-WH] ❌ No user found for email:', buyerEmail)
                    }
                }
                break
            }

            // ── Recurring payment success (subscription renewal) ──
            case 'subscription.recurring.payment.success': {
                const contractToMatch = parentContractId || contractId
                console.log('[LAVA-WH] Recurring payment for contract:', contractToMatch)

                const result = await supabaseAdmin
                    .from('profiles')
                    .update({
                        generations_count: 0,
                        subscription_status: 'active',
                        plan: 'pro',
                        generations_limit: 999999,
                    })
                    .eq('lava_contract_id', contractToMatch)
                    .select()

                console.log('[LAVA-WH] Recurring update result:', JSON.stringify(result.data), '| Error:', JSON.stringify(result.error))

                if (result.error) {
                    console.error('[LAVA-WH] ❌ Recurring reset failed:', result.error.message)
                } else {
                    console.log('[LAVA-WH] ✅ Monthly usage reset for contract:', contractToMatch)
                }
                break
            }

            // ── Subscription cancelled ──
            case 'subscription.cancelled': {
                const cancelContractId = contractId
                const willExpireAt = body.willExpireAt || null
                console.log('[LAVA-WH] Cancellation for contract:', cancelContractId, '| willExpireAt:', willExpireAt)

                const cancelUpdate: Record<string, unknown> = {
                    subscription_status: 'cancelled',
                }

                const result = await supabaseAdmin
                    .from('profiles')
                    .update(cancelUpdate)
                    .eq('lava_contract_id', cancelContractId)
                    .select()

                console.log('[LAVA-WH] Cancel result:', JSON.stringify(result.data), '| Error:', JSON.stringify(result.error))

                if (result.error) {
                    console.error('[LAVA-WH] ❌ Cancellation update failed:', result.error.message)
                } else {
                    console.log('[LAVA-WH] ✅ Subscription cancelled for contract:', cancelContractId)
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
        console.error('[LAVA-WH] ❌ Webhook handler EXCEPTION:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
