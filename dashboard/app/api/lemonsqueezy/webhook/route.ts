import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger, getClientIp } from '@/lib/logger'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const payload = await request.text()
    const signature = request.headers.get('x-signature')
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    const ip = getClientIp(request)

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      logger.security('webhook.invalid_signature', { ip, route: '/api/lemonsqueezy/webhook' })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(payload)
    const eventName = event.meta.event_name
    const customData = event.meta.custom_data

    logger.info('webhook.received', { eventName, route: '/api/lemonsqueezy/webhook' })

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        const userId = customData?.user_id
        if (!userId) {
          logger.warn('webhook.missing_user_id', { eventName, route: '/api/lemonsqueezy/webhook' })
          return NextResponse.json({ received: true })
        }

        const subscriptionData = event.data.attributes
        const variantId = subscriptionData.variant_id

        // Determine tier based on variant
        let tier = 'free'
        let repliesLimit = 20

        if (variantId === process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID) {
          tier = 'pro'
          repliesLimit = 999999
        } else if (variantId === process.env.NEXT_PUBLIC_LEMONSQUEEZY_UNLIMITED_VARIANT_ID) {
          tier = 'unlimited'
          repliesLimit = 999999
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: tier,
            subscription_status: subscriptionData.status,
            lemonsqueezy_customer_id: subscriptionData.customer_id.toString(),
            lemonsqueezy_subscription_id: event.data.id,
            generations_limit: repliesLimit,
          })
          .eq('id', userId)

        if (error) {
          logger.error('webhook.profile_update_failed', { userId, eventName, dbError: error.message })
        }
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        const subscriptionId = event.data.id

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            subscription_status: 'cancelled',
            generations_limit: 20,
          })
          .eq('lemonsqueezy_subscription_id', subscriptionId)

        if (error) {
          logger.error('webhook.cancellation_failed', { subscriptionId, eventName, dbError: error.message })
        }
        break
      }

      case 'subscription_payment_success': {
        // Reset monthly usage on successful payment
        const subscriptionId = event.data.attributes.subscription_id

        const { error } = await supabase
          .from('profiles')
          .update({
            generations_count: 0,
          })
          .eq('lemonsqueezy_subscription_id', subscriptionId.toString())

        if (error) {
          logger.error('webhook.usage_reset_failed', { subscriptionId, eventName, dbError: error.message })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.exception('webhook.error', error, { route: '/api/lemonsqueezy/webhook' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
