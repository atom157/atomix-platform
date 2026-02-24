import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/cors'
import { logger, getClientIp } from '@/lib/logger'
import { verifyExtensionToken } from '@/lib/verify-extension-token'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return NextResponse.json(null, { headers: getCorsHeaders(origin) })
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabase = getSupabaseAdmin()

    const ip = getClientIp(request)

    // Verify the extension token from Authorization header
    const tokenResult = await verifyExtensionToken(request)
    if (!tokenResult.valid) {
      logger.security('prompts.auth_failed', { ip, route: '/api/extension/prompts', reason: tokenResult.error })
      return NextResponse.json(
        { error: tokenResult.error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Use the verified userId from the token, NOT from query params
    const userId = tokenResult.userId!

    // Get user's prompts
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('id, name, is_default')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('prompts.fetch_failed', { userId, dbError: error.message })
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Get user profile for usage info
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, generations_count, generations_limit')
      .eq('id', userId)
      .single()

    return NextResponse.json(
      {
        prompts: prompts || [],
        usage: profile
          ? {
            tier: profile.plan,
            used: profile.generations_count,
            limit: (profile.plan === 'free' || profile.plan === 'trial') ? 20 : profile.generations_limit,
          }
          : null,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    logger.exception('prompts.error', error, { route: '/api/extension/prompts' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabase = getSupabaseAdmin()
    const ip = getClientIp(request)

    const tokenResult = await verifyExtensionToken(request)
    if (!tokenResult.valid) {
      logger.security('prompts.create_auth_failed', { ip, route: '/api/extension/prompts', reason: tokenResult.error })
      return NextResponse.json(
        { error: tokenResult.error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const userId = tokenResult.userId!

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders })
    }

    const { name, content } = body as Record<string, unknown>

    if (typeof name !== 'string' || !name.trim() || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Prompt name and content are required' }, { status: 400, headers: corsHeaders })
    }

    const { data: newPrompt, error } = await supabase
      .from('prompts')
      .insert({
        user_id: userId,
        name: name.trim().slice(0, 100),
        content: content.trim().slice(0, 5000),
        is_default: false
      })
      .select('id, name, is_default')
      .single()

    if (error) {
      logger.error('prompts.create_failed', { userId, dbError: error.message })
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ prompt: newPrompt }, { headers: corsHeaders })
  } catch (error) {
    logger.exception('prompts.post_error', error, { route: '/api/extension/prompts' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
