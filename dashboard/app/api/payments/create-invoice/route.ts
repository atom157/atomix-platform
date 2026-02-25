import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const LAVA_API_BASE = 'https://gate.lava.top'
const LAVA_OFFER_ID = 'a1151102-abca-4f02-b96e-29d9036e3a6b'

export async function POST() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Create invoice via Lava.top v3 API
        const invoiceResponse = await fetch(`${LAVA_API_BASE}/api/v3/invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': process.env.LAVA_API_KEY_PRIMARY!,
            },
            body: JSON.stringify({
                email: user.email,
                offerId: LAVA_OFFER_ID,
                currency: 'USD',
                periodicity: 'MONTHLY',
                buyerLanguage: 'EN',
                // Pass Supabase user.id via UTM so webhook can map the payment back
                clientUtm: {
                    utm_source: 'atomix',
                    utm_medium: 'dashboard',
                    utm_campaign: 'pro_upgrade',
                    utm_content: user.id,
                },
            }),
        })

        if (!invoiceResponse.ok) {
            const errorData = await invoiceResponse.json().catch(() => ({}))
            console.error('[LAVA] Invoice creation failed:', invoiceResponse.status, errorData)
            return NextResponse.json(
                { error: errorData.error || 'Payment service error' },
                { status: invoiceResponse.status }
            )
        }

        const invoice = await invoiceResponse.json()

        if (!invoice.paymentUrl) {
            return NextResponse.json(
                { error: 'No payment URL received' },
                { status: 500 }
            )
        }

        return NextResponse.json({ paymentUrl: invoice.paymentUrl })
    } catch (error) {
        console.error('[LAVA] create-invoice error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
