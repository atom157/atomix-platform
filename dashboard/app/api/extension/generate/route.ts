import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getCorsHeaders } from '@/lib/cors'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger, getClientIp } from '@/lib/logger'
import { sanitizeText, validateUserId, validateTweetData, validateSettings } from '@/lib/validation'
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

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabase = getSupabaseAdmin()

    const ip = getClientIp(request)

    // Verify the extension token from Authorization header
    const tokenResult = await verifyExtensionToken(request)
    if (!tokenResult.valid) {
      logger.security('generate.auth_failed', { ip, route: '/api/extension/generate', reason: tokenResult.error })
      return NextResponse.json(
        { error: tokenResult.error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Parse and validate body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { tweetData, promptId, settings } = body as Record<string, unknown>

    // Use the verified userId from the token, NOT from the request body
    const userId = tokenResult.userId!

    // Rate limit check per user
    const rateCheck = await checkRateLimit(`generate:${userId}`, RATE_LIMITS.generate)
    if (!rateCheck.allowed) {
      logger.security('generate.rate_limit_exceeded', { userId, ip, route: '/api/extension/generate' })
      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down.',
          retryAfter: Math.ceil(rateCheck.resetMs / 1000),
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)),
          },
        }
      )
    }

    // Validate tweetData
    if (!tweetData || !validateTweetData(tweetData as Record<string, unknown>)) {
      return NextResponse.json(
        { error: 'Invalid or missing tweet data' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate promptId if provided
    if (promptId && !validateUserId(promptId as string)) {
      return NextResponse.json(
        { error: 'Invalid prompt ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate and sanitize settings
    const safeSettings = settings ? validateSettings(settings as Record<string, unknown>) : {}

    // Sanitize tweet data
    const safeTweetData = {
      text: sanitizeText((tweetData as Record<string, unknown>).text as string),
      author: sanitizeText((tweetData as Record<string, unknown>).author as string),
      handle: sanitizeText((tweetData as Record<string, unknown>).handle as string),
      metrics: (tweetData as Record<string, unknown>).metrics as Record<string, string> | undefined,
      threadContext: Array.isArray((tweetData as Record<string, unknown>).threadContext)
        ? ((tweetData as Record<string, unknown>).threadContext as string[]).slice(0, 5).map(t => sanitizeText(t))
        : undefined,
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found. Please sign in at the dashboard.' },
        { status: 404, headers: corsHeaders }
      )
    }

    // ── Lazy expiration: downgrade if cancelled subscription period has ended ──
    if (
      profile.cancel_at_period_end &&
      profile.current_period_end &&
      new Date(profile.current_period_end) < new Date()
    ) {
      await supabase
        .from('profiles')
        .update({
          plan: 'free',
          subscription_status: 'expired',
          generations_limit: 20,
          cancel_at_period_end: false,
        })
        .eq('id', userId)

      profile.plan = 'free'
      profile.generations_limit = 20
    }

    // Check usage limits
    const effectiveLimit = (profile.plan === 'free' || profile.plan === 'trial') ? 20 : profile.generations_limit;
    if (profile.generations_count >= effectiveLimit) {
      return NextResponse.json(
        { error: 'Reply limit reached. Please upgrade your plan.' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get the prompt either inline from the extension UI or from the database
    let promptContent = (safeSettings.customPrompt as string) || ''

    if (!promptContent && promptId) {
      const { data: prompt } = await supabase
        .from('prompts')
        .select('content')
        .eq('id', promptId)
        .eq('user_id', userId)
        .single()

      if (prompt) {
        promptContent = prompt.content
      }
    }

    // If no specific prompt, get the default one
    if (!promptContent) {
      const { data: defaultPrompt } = await supabase
        .from('prompts')
        .select('content')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single()

      if (defaultPrompt) {
        promptContent = defaultPrompt.content
      }
    }

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(promptContent, safeSettings)
    const userPrompt = buildUserPrompt(safeTweetData)

    // Use user's API key if available, otherwise use default
    const apiKey = profile.openai_api_key || process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured. Please add your OpenAI API key in settings.' },
        { status: 500, headers: corsHeaders }
      )
    }

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: (safeSettings as Record<string, unknown>)?.model as string || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 280,
      temperature: 0.8,
    })

    const reply = completion.choices[0]?.message?.content?.trim() || ''

    // Update usage count
    await supabase
      .from('profiles')
      .update({ generations_count: profile.generations_count + 1 })
      .eq('id', userId)

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: userId,
      prompt_id: promptId || null,
      tweet_text: safeTweetData.text || null,
      generated_reply: reply,
      model: (safeSettings as Record<string, unknown>)?.model as string || 'gpt-4o-mini',
      tokens_used: completion.usage?.total_tokens || 0,
    })

    return NextResponse.json(
      {
        reply,
        usage: {
          used: profile.generations_count + 1,
          limit: effectiveLimit,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    logger.exception('generate.error', error, { route: '/api/extension/generate' })

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401, headers: corsHeaders }
        )
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Try again later.' },
          { status: 429, headers: corsHeaders }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500, headers: corsHeaders }
    )
  }
}

function buildSystemPrompt(customPrompt: string, settings: Record<string, unknown>) {
  const toneDescriptions: Record<string, string> = {
    friendly: 'friendly and warm, like a real person chatting',
    professional: 'professional and business-like, but not stiff or corporate',
    casual: 'casual and relaxed, as if texting a friend',
    witty: 'witty and clever, with subtle humor',
    supportive: 'supportive and empathetic, genuinely caring',
    curious: 'curious and interested, asking thoughtful follow-ups',
  }

  const lengthDescriptions: Record<string, string> = {
    short: '1-2 short sentences (under 80 characters ideally)',
    medium: '2-3 sentences',
    long: '3-4 sentences, still concise and punchy',
  }

  const languageDescriptions: Record<string, string> = {
    same: 'the same language as the original tweet',
    uk: 'Ukrainian',
    en: 'English',
    ru: 'Russian',
  }

  const tone = (settings?.tone as string) || 'friendly'
  const length = (settings?.length as string) || 'medium'
  const language = (settings?.language as string) || 'same'
  const mentionAuthor = settings?.mentionAuthor !== false
  const addEmoji = settings?.addEmoji !== false
  const includeHashtags = settings?.includeHashtags === true
  const bannedWords = settings?.bannedWords as string

  let basePrompt = `You are a real person replying on Twitter/X. Your goal is to write a reply that feels completely human and natural - as if typed quickly on a phone.

SENTIMENT AWARENESS:
- First, detect the emotional tone of the original tweet (happy, frustrated, sad, excited, angry, neutral, sarcastic, informative).
- Match your emotional energy appropriately: celebrate good news, empathize with struggles, engage thoughtfully with opinions.
- If the tweet is sarcastic or humorous, you may respond with matching wit - never be oblivious to irony.
- If the tweet expresses frustration or sadness, lead with empathy before adding value.

HUMANIZER RULES (critical for natural output):
- Vary your sentence structure. Mix short punchy sentences with longer ones.
- Use contractions naturally (don't, can't, it's, that's).
- Occasionally start sentences with "And", "But", "Also", "Honestly", "Ngl" or similar casual connectors.
- Do NOT use overly polished or marketing-style language.
- Do NOT use phrases like "Great point!", "Absolutely!", "This is so true!", "Couldn't agree more!" - these scream AI.
- Do NOT start with "I" or with a direct compliment. Vary your openings.
- Avoid exclamation marks overuse (max 1 per reply).
- Sound like a knowledgeable friend, not a customer service bot.

STYLE RULES:
1. Tone: ${toneDescriptions[tone] || 'friendly'}
2. Length: ${lengthDescriptions[length] || '2-3 sentences'}
3. Language: Write in ${languageDescriptions[language] || 'the same language as the original tweet'}
4. ${mentionAuthor ? 'You may reference the author naturally by name or @handle, but only when it fits' : 'Do not mention the author directly'}
5. ${addEmoji ? 'Use 1-2 emojis only if they feel natural, not decorative' : 'Do NOT use any emojis'}
6. ${includeHashtags ? 'You can add 1-2 relevant hashtags at the end' : 'Do NOT add hashtags'}

CONTENT RULES:
- Add genuine value: share a related thought, a personal angle, a relevant question, or useful context.
- If the tweet shares an achievement, acknowledge it without being over-the-top.
- If the tweet asks a question, answer it directly and concisely.
- If the tweet is a hot take, engage with the argument, not just agree/disagree.
- Never repeat or paraphrase the original tweet back to the author.
- Keep the reply self-contained - it should make sense even without seeing the original tweet.

OUTPUT:
- Return ONLY the reply text. No quotes, no labels, no "Reply:" prefix.`

  if (bannedWords) {
    basePrompt += `\n\nFORBIDDEN WORDS/PHRASES (never use these): ${bannedWords}`
  }

  if (customPrompt) {
    if (customPrompt.includes('{{tweet}}')) {
      basePrompt = customPrompt
    } else {
      basePrompt += `\n\nADDITIONAL USER INSTRUCTIONS:\n${customPrompt}`
    }
  }

  return basePrompt
}

function buildUserPrompt(tweetData: Record<string, unknown>) {
  const text = tweetData.text as string
  const author = tweetData.author as string
  const handle = tweetData.handle as string
  const metrics = tweetData.metrics as Record<string, string> | undefined
  const threadContext = tweetData.threadContext as string[] | undefined

  let userPrompt = ''

  // Provide thread context first so the model understands the conversation flow
  if (threadContext && threadContext.length > 0) {
    userPrompt += `Thread context (earlier messages in the conversation):\n${threadContext.map((t, i) => `  ${i + 1}. "${t}"`).join('\n')}\n\n`
  }

  userPrompt += `Tweet by ${author} (${handle}):\n"${text}"`

  // Metrics help gauge engagement level and audience
  if (metrics && Object.keys(metrics).length > 0) {
    const likes = metrics.likes || '0'
    const retweets = metrics.retweets || '0'
    if (likes !== '0' || retweets !== '0') {
      userPrompt += `\n[${likes} likes, ${retweets} retweets]`
    }
  }

  userPrompt += '\n\nWrite one reply:'

  return userPrompt
}
