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

    // Validate tweetData — log exactly which fields are missing
    const td = tweetData as Record<string, unknown> | null
    if (!td) {
      console.error('[GENERATE] tweetData is null/undefined')
      return NextResponse.json(
        { error: 'Missing tweet data' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('[GENERATE] Tweet data received:', {
      hasText: !!td.text,
      textLength: typeof td.text === 'string' ? td.text.length : 0,
      author: td.author || '(empty)',
      handle: td.handle || '(empty)',
      hasThread: Array.isArray(td.threadContext),
    })

    // Only text is strictly required — author/handle can be empty
    if (typeof td.text !== 'string' || td.text.trim().length === 0) {
      console.error('[GENERATE] Invalid tweet text:', typeof td.text, td.text)
      return NextResponse.json(
        { error: 'Missing tweet text — scraper could not read the tweet' },
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
      channelName: sanitizeText((tweetData as Record<string, unknown>).channelName as string),
      serverName: sanitizeText((tweetData as Record<string, unknown>).serverName as string),
      metrics: (tweetData as Record<string, unknown>).metrics as Record<string, string> | undefined,
      threadContext: Array.isArray((tweetData as Record<string, unknown>).threadContext)
        ? ((tweetData as Record<string, unknown>).threadContext as string[]).slice(0, 10).map(t => sanitizeText(t))
        : undefined,
      isGreetingChannel: (tweetData as Record<string, unknown>).isGreetingChannel === true,
      timeContext: sanitizeText((tweetData as Record<string, unknown>).timeContext as string) || 'morning',
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
          plan: 'trial',
          subscription_status: 'expired',
          generations_limit: 20,
          cancel_at_period_end: false,
        })
        .eq('id', userId)

      profile.plan = 'trial'
      profile.generations_limit = 20
    }

    // Check usage limits — read directly from DB, no overrides
    const effectiveLimit = profile.generations_limit;
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

    // If no specific prompt, get the default one for the platform
    if (!promptContent) {
      const platform = (safeSettings as Record<string, unknown>)?.platform as string || 'discord'
      
      const { data: defaultPrompt } = await supabase
        .from('prompts')
        .select('content')
        .eq('user_id', userId)
        .eq('is_default', true)
        .eq('platform', platform)
        .single()

      if (defaultPrompt) {
        promptContent = defaultPrompt.content
      }
    }

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(promptContent, safeSettings, safeTweetData)
    const generateMode = (safeSettings as Record<string, unknown>)?.generateMode as string || 'reply'
    const userPrompt = buildUserPrompt(safeTweetData, generateMode)

    console.log('Generating response with Anthropic in:', (safeSettings as Record<string, unknown>)?.language || 'same', 'with length:', (safeSettings as Record<string, unknown>)?.length || 'medium')

    const isKillSwitchActive = safeTweetData.isGreetingChannel;
    let finalMessages: any[] = [];
    let extractedSystemPrompt = '';

    if (isKillSwitchActive) {
      const greeting = safeTweetData.timeContext === 'night' ? 'gn' : 'gm';
      finalMessages = [ { role: 'user', content: `I am in a greeting channel. It is currently ${safeTweetData.timeContext}. Reply with '${greeting}' only. No punctuation. No other words.` } ];
    } else {
      extractedSystemPrompt = systemPrompt;
      finalMessages = [
        { role: 'user', content: userPrompt },
      ];
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured in environment variables.' },
        { status: 500, headers: corsHeaders }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        temperature: 0.8,
        system: extractedSystemPrompt || undefined,
        messages: finalMessages
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Anthropic API Error:', errData);
      return NextResponse.json(
        { error: 'Anthropic generation failed: ' + (errData.error?.message || response.statusText) },
        { status: response.status, headers: corsHeaders }
      )
    }

    const completion = await response.json();
    const reply = completion.content?.[0]?.text?.trim() || '';

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

function buildSystemPrompt(customPrompt: string, settings: Record<string, unknown>, tweetData?: Record<string, unknown>) {
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
    same: 'the same language as the original context',
    uk: 'Ukrainian',
    en: 'English',
    ru: 'Russian',
  }

  const tone = (settings?.tone as string) || 'friendly'
  const length = (settings?.length as string) || 'medium'
  const language = (settings?.language as string) || 'same'
  const mentionAuthor = settings?.mentionAuthor === true
  const addEmoji = settings?.addEmoji === true
  const includeHashtags = settings?.includeHashtags === true
  const bannedWords = settings?.bannedWords as string
  const generateMode = (settings?.generateMode as string) || 'reply'

  let basePrompt = '';

  if (generateMode === 'starter' || generateMode === 'polish') {
    // Minimal generic instructions to avoid overriding the user's custom persona (e.g. "lazy degen")
    basePrompt = `You are a real person participating in a chat environment.

STYLE RULES:
1. Tone: ${toneDescriptions[tone] || 'friendly'}
2. Length: ${lengthDescriptions[length] || '1-2 sentences'}
3. Language: Write in ${languageDescriptions[language] || 'the same language as the original context'}
4. ${addEmoji ? 'Integrate expressive and relevant emojis naturally into the text' : 'STRICT RULE: Do NOT use any emojis, emoticons, or Unicode symbols whatsoever'}
5. ${includeHashtags ? 'Include 1-3 relevant and trending hashtags at the end of the response' : 'STRICT RULE: Do NOT include any hashtags'}

OUTPUT:
- Return ONLY the final message text. No quotes, no labels, no conversational filler prefixes.`
  } else {
    // Normal Reply Mode
    basePrompt = `You are a real person replying on Twitter/X. Your goal is to write a reply that feels completely human and natural - as if typed quickly on a phone.

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
4. ${mentionAuthor ? 'Start or weave in the author\'s @handle naturally in the reply' : 'STRICT RULE: Do NOT mention or reference the author\'s handle anywhere in the reply'}
5. ${addEmoji ? 'Integrate expressive and relevant emojis naturally into the text' : 'STRICT RULE: Do NOT use any emojis, emoticons, or Unicode symbols whatsoever'}
6. ${includeHashtags ? 'Include 1-3 relevant and trending hashtags at the end of the response' : 'STRICT RULE: Do NOT include any hashtags'}

CONTENT RULES:
- Analyze the provided thread history. If a greeting (Hi, Hello, Hey, etc.) has already been exchanged in the last 3 messages of this thread, DO NOT include a greeting in the new response. Jump straight to the point.
- Add genuine value: share a related thought, a personal angle, a relevant question, or useful context.
- If the tweet shares an achievement, acknowledge it without being over-the-top.
- If the tweet asks a question, answer it directly and concisely.
- If the tweet is a hot take, engage with the argument, not just agree/disagree.
- Never repeat or paraphrase the original tweet back to the author.
- Keep the reply self-contained - it should make sense even without seeing the original tweet.

OUTPUT:
- Return ONLY the reply text. No quotes, no labels, no "Reply:" prefix.`
  }

  // ── ANTI-BOT & WEB3 ETIQUETTE RULES ──
  basePrompt += `

ANTI-BOT & WEB3 ETIQUETTE:
- NEVER introduce yourself as an AI or assistant.
- Avoid forced enthusiasm (e.g., "Absolutely!", "Great point", "I completely agree").
- Do not answer rhetorical questions literally.
- Never wrap your final answer in quotes.
- If the chat implies airdrops or whitelists, be concise and use community slang (e.g., LFG, bullish).`

  const channelName = (tweetData?.channelName as string)?.toLowerCase() || '';
  if (channelName.includes('gm') || channelName.includes('gn') || channelName.includes('good-morning')) {
    basePrompt += `
    
=== CRITICAL CHANNEL CONTEXT ===
You are in a Web3 greeting channel ("${channelName}"). Users here just post short greetings.
STRICT RULE: Do NOT start conversations. Do NOT ask questions like "How are you?" or "What do you want to talk about?".
ONLY reply with a short greeting like "gm", "gn", "gm fam", or a relevant emoji. Scale back your response entirely to match this minimalist etiquette.`
  }

  if (bannedWords) {
    basePrompt += `\n\nSTRICT RULE — FORBIDDEN WORDS: Do not use any of the following words or their variations, synonyms, or related forms in your response: ${bannedWords}. This is a hard requirement. Check your output and remove any matches before returning.`
  }

  if (customPrompt) {
    if (customPrompt.includes('{{tweet}}')) {
      basePrompt = customPrompt
    } else {
      basePrompt += `\n\nADDITIONAL USER INSTRUCTIONS:\n${customPrompt}`
    }
  }

  // ── HIGH PRIORITY: Language enforcement (appended LAST to override everything) ──
  if (language && language !== 'same') {
    const langName = languageDescriptions[language] || language
    basePrompt += `\n\n=== CRITICAL LANGUAGE OVERRIDE ===\nIMPORTANT: You MUST write your ENTIRE response in ${langName}. Even if the original context is in a different language, your response MUST be in ${langName}. This is a hard requirement — do NOT switch languages. Every single word of your reply must be in ${langName}.`
  } else {
    // Auto "same" mode
    basePrompt += `\n\n=== AUTO LANGUAGE MIRRORING ===
DETECT LANGUAGE: Identify the primary language of the target message and the channel name. You MUST generate the response in that same language. Do not translate to English unless the input was in English.
Secondary Rule (Channel Hint): If the language of the message is ambiguous, check the channel name (e.g., "${tweetData?.channelName || ''}"). If it contains words like ukrainian, spanish, russian, chinese, etc., use that as the target language.`
  }

  // ── FINAL OVERRIDES: Toggle enforcement (absolute last instructions) ──
  let toggleOverrides = '\n\n=== FINAL OUTPUT REQUIREMENTS (override everything above) ==='
  if (addEmoji) {
    toggleOverrides += '\nCRITICAL: You MUST include at least 2-3 relevant emojis in this response. This is a hard requirement that overrides all other style rules.'
  } else {
    toggleOverrides += '\nABSOLUTE BAN: Do NOT include any emojis, emoticons, or Unicode symbols. Zero emojis allowed.'
  }
  if (includeHashtags) {
    toggleOverrides += '\nCRITICAL: You MUST end the response with 2-3 relevant hashtags. This is a hard requirement that overrides all other style rules.'
  } else {
    toggleOverrides += '\nABSOLUTE BAN: Do NOT include any hashtags. Zero hashtags allowed.'
  }
  if (generateMode === 'reply') {
    if (mentionAuthor) {
      toggleOverrides += '\nCRITICAL: You MUST start the reply by tagging the author with their @handle. This is a hard requirement.'
    } else {
      toggleOverrides += '\nABSOLUTE BAN: Do NOT mention or reference the author\'s @handle anywhere in the reply.'
    }
  }
  basePrompt += toggleOverrides

  return basePrompt
}

function buildUserPrompt(tweetData: Record<string, unknown>, generateMode: string = 'reply') {
  const text = tweetData.text as string
  const author = tweetData.author as string
  const handle = tweetData.handle as string
  const metrics = tweetData.metrics as Record<string, string> | undefined
  const threadContext = tweetData.threadContext as string[] | undefined
  const channelName = (tweetData.channelName as string)?.toLowerCase() || ''

  const isGreetingChannel = channelName.includes('gm') || channelName.includes('gn') || channelName.includes('good-morning')

  let userPrompt = ''

  if (threadContext && threadContext.length > 0) {
    userPrompt += `Chat history context:\n${threadContext.map((t, i) => `  ${i + 1}. "${t}"`).join('\n')}\n\n`
  }

  if (generateMode === 'starter') {
    if (isGreetingChannel) {
      userPrompt += `Task: YOU ARE IN A GREETING CHANNEL. Just say a short greeting like "gm", "gn", or use an emoji. Do NOT start a conversation or ask questions.\n\nReturn ONLY the message text without prefixes or explanation.`
    } else {
      userPrompt += `Task: Generate a natural and engaging conversation starter for this chat.\n\nReturn ONLY the message text without prefixes or explanation.`
    }
  } else if (generateMode === 'polish') {
    userPrompt += `The user has drafted the following message:\n"${text}"\n\nTask: Finish their thought naturally, and polish the phrasing to fit the conversation flow and system persona.\n\nReturn ONLY the complete, final message text without prefixes or explanation.`
  } else {
    userPrompt += `Tweet by ${author} (${handle}):\n"${text}"`
    if (metrics && Object.keys(metrics).length > 0) {
      const likes = metrics.likes || '0'
      const retweets = metrics.retweets || '0'
      if (likes !== '0' || retweets !== '0') {
        userPrompt += `\n[${likes} likes, ${retweets} retweets]`
      }
    }
    userPrompt += '\n\nWrite one reply:'
  }

  return userPrompt
}

