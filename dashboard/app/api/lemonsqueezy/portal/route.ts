import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('lemonsqueezy_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.lemonsqueezy_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'LemonSqueezy configuration missing' },
        { status: 500 }
      )
    }

    // Get customer portal URL
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/customers/${profile.lemonsqueezy_customer_id}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      logger.error('portal.lemonsqueezy_error', { userId: user.id, statusCode: response.status, apiError: JSON.stringify(data) })
      return NextResponse.json(
        { error: 'Failed to get portal URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      portalUrl: data.data.attributes.urls.customer_portal,
    })
  } catch (error) {
    logger.exception('portal.error', error, { route: '/api/lemonsqueezy/portal' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
