import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { variantId } = await request.json()

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 })
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    const apiKey = process.env.LEMONSQUEEZY_API_KEY

    if (!storeId || !apiKey) {
      return NextResponse.json(
        { error: 'LemonSqueezy configuration missing' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
              },
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('checkout.lemonsqueezy_error', { userId: user.id, statusCode: response.status, apiError: JSON.stringify(data) })
      return NextResponse.json(
        { error: 'Failed to create checkout' },
        { status: 500 }
      )
    }

    logger.info('checkout.created', { userId: user.id, variantId })

    return NextResponse.json({
      checkoutUrl: data.data.attributes.url,
    })
  } catch (error) {
    logger.exception('checkout.error', error, { route: '/api/lemonsqueezy/checkout' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
