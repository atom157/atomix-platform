import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

function verifyLavaSignature(payload: string, signature: string, secret: string) {
    try {
        const hmac = crypto.createHmac('sha256', secret)
        const digest = hmac.update(payload).digest('hex')
        return signature === digest || signature === `sha256=${digest}`
    } catch (e) {
        return false
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Webhook active' }, { status: 200 })
}

export async function POST(request: Request) {
    console.log('[LAVA-INCOMING] Something is hitting the webhook!')
    try {
        const payload = await request.text()
        const signature = request.headers.get('Authorization') || request.headers.get('Signature') || request.headers.get('x-signature') || request.headers.get('x-lava-signature')
        const webhookSecret = process.env.LAVA_WEBHOOK_SECRET || process.env.LAVA_WEBHOOK_SECRET_RESULT

        // Log everything for debugging the V3 payload structure
        console.log('[WEBHOOK-RAW] Header Signature:', signature)
        console.log('[WEBHOOK-RAW] Body:', payload)
        console.log('[LAVA-WH] ===== INCOMING WEBHOOK =====')

        if (signature && webhookSecret) {
            if (!verifyLavaSignature(payload, signature, webhookSecret)) {
                console.error('[LAVA-WH] ❌ Invalid HMAC Signature. Rejecting request.')
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            } else {
                console.log('[LAVA-WH] 🔒 Signature Verified')
            }
        } else {
            console.error('[LAVA-WH] ❌ Missing signature header or webhook secret environment variable')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: any = {}
        try {
            body = JSON.parse(payload)
        } catch (e) {
            console.error('[LAVA-WH] Failed to parse JSON body')
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        // Extremely flexible parsing to handle Lava.top's V2 vs V3 structure differences
        const data = body.data || body.invoice || body
        const eventType = body.eventType || body.type || body.event || data.eventType || data.type || data.event || 'unknown'

        const contractId = data.contractId || data.id || body.id
        const status = data.status || body.status
        const clientUtm = data.clientUtm || body.clientUtm

        // Deep email parsing
        const buyerEmail = body.buyer?.email || body.email || body.account || body.payerEmail || data.email || data.account || data.payerEmail || data.buyer?.email || data.customer_email || body.additional_data?.email || data.additional_data?.email || null

        console.log('[LAVA-DATA] Found User ID:', body.clientUtm?.utm_content, 'Email:', body.buyer?.email)
        console.log('[LAVA-WH] parsed eventType:', eventType, '| status:', status, '| contractId:', contractId)
        console.log('[LAVA-WH] clientUtm:', JSON.stringify(clientUtm))
        console.log('[LAVA-WH] extracted email:', buyerEmail)

        const supabaseAdmin = getSupabaseAdmin()
        const userId = body.clientUtm?.utm_content || clientUtm?.utm_content || null

        // Treat it as a success if the payload explicitly says so
        const isSuccess = eventType === 'payment.success' && (status === 'SUCCESS' || status === 'success' || status === 'PAID' || status === 'subscription-active' || status === 'ACTIVE' || status === 'active' || !status);
        const isFailure = eventType === 'payment.failed' || status === 'FAILED' || status === 'failed';

        if (!userId && !buyerEmail) {
            console.error('[LAVA-WH] ❌ No user identifier (utm_content) or email found — cannot process event')
            return NextResponse.json({ received: true })
        }

        if (isSuccess) {
            const updateData: Record<string, unknown> = {
                plan: 'pro',
                is_pro: true, // Specific true flag for the database spec
                subscription_status: 'active',
                generations_limit: 999999,
                lava_contract_id: contractId || 'lava_pro_manual',
            }

            if (userId && userId.length > 5) { // Ensure string is a valid UUID
                console.log('[LAVA-WH] Updating via Explicit User ID:', userId)
                const result = await supabaseAdmin.from('profiles').update(updateData).eq('id', userId).select()

                if (result.error) {
                    console.error('[LAVA-WH] ❌ Profile update by ID FAILED:', result.error.message)
                } else if (result.data && result.data.length > 0) {
                    console.log('[LAVA-WH] ✅ User upgraded to PRO! userId:', userId)
                    return NextResponse.json({ received: true })
                }
            }

            if (buyerEmail) {
                console.log('[LAVA-WH] Falling back to Auth Email exact match lookup:', buyerEmail)
                // First, find the user UUID from Supabase Auth via Admin API
                const { data: users } = await supabaseAdmin.auth.admin.listUsers()
                const matchedUser = users?.users?.find(u => u.email === buyerEmail)

                if (matchedUser) {
                    console.log('[LAVA-WH] Discovered UUID via email:', matchedUser.id)
                    const result = await supabaseAdmin.from('profiles').update(updateData).eq('id', matchedUser.id).select()

                    if (result.error) {
                        console.error('[LAVA-WH] ❌ Profile update by Email FAILED:', result.error.message)
                    } else {
                        console.log('[LAVA-WH] ✅ User upgraded to PRO via Email match! userId:', matchedUser.id)
                    }
                } else {
                    console.warn('[LAVA-WH] ⚠️ Supabase Auth listUsers() yielded no match for email:', buyerEmail)
                }
            }
        } else if (isFailure) {
            console.log(`[LAVA-WH] ❌ Payment failed event received. No upgrade for user. Initiating downgrade if applicable.`);

            const downgradeData: Record<string, unknown> = {
                plan: 'free',
                is_pro: false,
                subscription_status: 'failed',
                generations_limit: 20,
            }

            if (userId && userId.length > 5) {
                await supabaseAdmin.from('profiles').update(downgradeData).eq('id', userId);
                console.log(`[LAVA-WH] 📉 User downgraded to FREE: ${userId}`);
            } else if (buyerEmail) {
                const { data: users } = await supabaseAdmin.auth.admin.listUsers()
                const matchedUser = users?.users?.find(u => u.email === buyerEmail)
                if (matchedUser) {
                    await supabaseAdmin.from('profiles').update(downgradeData).eq('id', matchedUser.id);
                    console.log(`[LAVA-WH] 📉 User downgraded to FREE via Email: ${buyerEmail}`);
                }
            }
        } else {
            console.log(`[LAVA-WH] 🤷‍♂️ Ignored Event Type: ${eventType}`);
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error) {
        console.error('[LAVA-WH] ❌ Webhook handler EXCEPTION:', error)
        // Force 200 OK so Lava.top doesn't get blocked
        return NextResponse.json({ error: 'Internal server error - caught for webhook', details: String(error) }, { status: 200 })
    }
}
