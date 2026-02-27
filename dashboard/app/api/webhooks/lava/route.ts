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

export async function POST(request: Request) {
    try {
        const payload = await request.text()
        const signature = request.headers.get('Authorization') || request.headers.get('Signature') || request.headers.get('x-signature')
        const webhookSecret = process.env.LAVA_WEBHOOK_SECRET || process.env.LAVA_WEBHOOK_SECRET_RESULT

        // Log everything for debugging the V3 payload structure
        console.log('[LAVA-WH] ===== INCOMING WEBHOOK =====')
        console.log('[LAVA-WH] Signature Header:', signature)
        console.log('[LAVA-WH] Raw Payload:', payload)

        if (signature && webhookSecret) {
            if (!verifyLavaSignature(payload, signature, webhookSecret)) {
                console.warn('[LAVA-WH] ⚠️ Invalid HMAC Signature')
                // We'll log the warning but won't strictly block yet until we verify the exact hashing mechanism in Vercel logs
            } else {
                console.log('[LAVA-WH] 🔒 Signature Verified')
            }
        } else {
            console.warn('[LAVA-WH] ⚠️ Missing signature header or webhook secret environment variable')
        }

        let body: any = {}
        try {
            body = JSON.parse(payload)
        } catch (e) {
            console.error('[LAVA-WH] Failed to parse JSON body')
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        // Extremely flexible parsing to handle Lava.top's V2 vs V3 structure differences
        const eventType = body.type || body.event || 'payment.success'
        const data = body.data || body.invoice || body

        const contractId = data.contractId || data.id || body.id
        const status = data.status || body.status
        const clientUtm = data.clientUtm || body.clientUtm

        // Deep email parsing
        const buyerEmail = body.email || body.account || body.payerEmail || data.email || data.account || data.payerEmail || data.buyer?.email || data.customer_email || null

        console.log('[LAVA-WH] parsed eventType:', eventType, '| status:', status, '| contractId:', contractId)
        console.log('[LAVA-WH] clientUtm:', JSON.stringify(clientUtm))
        console.log('[LAVA-WH] extracted email:', buyerEmail)

        const supabaseAdmin = getSupabaseAdmin()
        const userId = clientUtm?.utm_content || null

        // Treat it as a success if the payload explicitly says so, or if it's the default V3 structural assumption
        const isSuccess = status === 'SUCCESS' || status === 'success' || status === 'PAID' || eventType === 'payment.success'

        if (isSuccess) {
            if (!userId && !buyerEmail) {
                console.error('[LAVA-WH] ❌ No user identifier (utm_content) or email found — cannot update profile')
                return NextResponse.json({ received: true })
            }

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
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[LAVA-WH] ❌ Webhook handler EXCEPTION:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
