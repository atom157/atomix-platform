import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/cors'
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

        // Verify token
        const tokenResult = await verifyExtensionToken(request)
        if (!tokenResult.valid) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            )
        }

        const userId = tokenResult.userId!
        const body = await request.json()
        const { promptId } = body

        if (!promptId || typeof promptId !== 'string') {
            return NextResponse.json(
                { error: 'Missing promptId' },
                { status: 400, headers: corsHeaders }
            )
        }

        // Step 1: Clear all defaults for this user
        const { error: clearError } = await supabase
            .from('prompts')
            .update({ is_default: false })
            .eq('user_id', userId)

        if (clearError) {
            console.error('[SET-DEFAULT] Clear error:', clearError.message)
            return NextResponse.json(
                { error: 'Failed to clear defaults' },
                { status: 500, headers: corsHeaders }
            )
        }

        // Step 2: Set new default
        const { error: setError } = await supabase
            .from('prompts')
            .update({ is_default: true })
            .eq('id', promptId)
            .eq('user_id', userId)

        if (setError) {
            console.error('[SET-DEFAULT] Set error:', setError.message)
            return NextResponse.json(
                { error: 'Failed to set default' },
                { status: 500, headers: corsHeaders }
            )
        }

        console.log('[SET-DEFAULT] ✅ Default prompt set to:', promptId, 'for user:', userId)

        return NextResponse.json(
            { success: true },
            { headers: corsHeaders }
        )
    } catch (error) {
        console.error('[SET-DEFAULT] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        )
    }
}
