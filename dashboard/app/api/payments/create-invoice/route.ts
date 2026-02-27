import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const LAVA_API_BASE = 'https://gate.lava.top'
const LAVA_OFFER_ID = 'a1151102-abca-4f02-b96e-29d9036e3a6b'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const rawBody = await request.text();
        console.log('[DEBUG] Raw Request Body:', rawBody);

        let reqBody: any = {};
        try {
            reqBody = rawBody ? JSON.parse(rawBody) : {};
        } catch (parseError) {
            console.error('[DEBUG] Failed to parse request body as JSON:', parseError);
        }

        let finalEmail = reqBody.email || user?.email || user?.user_metadata?.email;

        // Force fallback for debugging if email is somehow entirely missing
        if (!finalEmail) {
            console.error('[FATAL] No email found even with fallbacks in body, session, or metadata. Using test fallback.');
            finalEmail = 'test-email@atomix.guru';
        }

        if (!finalEmail) {
            return NextResponse.json(
                { error: 'Unauthorized: User email is required' },
                { status: 401 }
            )
        }

        const payload = {
            email: finalEmail,
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
        };

        console.log('[LAVA-V3] Final Payload:', JSON.stringify(payload, null, 2));

        // Create invoice via Lava.top v3 API
        const invoiceResponse = await fetch(`${LAVA_API_BASE}/api/v3/invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': process.env.LAVA_API_KEY_PRIMARY!,
            },
            body: JSON.stringify(payload),
        })

        if (!invoiceResponse.ok) {
            const errorText = await invoiceResponse.text();
            console.error(`[LAVA] Invoice creation failed with status ${invoiceResponse.status}. Full response:`, errorText);

            let errorData = {};
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                // Ignore parse error
            }

            return NextResponse.json(
                { error: (errorData as any).error || 'Payment service error', details: errorText },
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
