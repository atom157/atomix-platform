(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__cae7d8cc._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/lib/logger.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Structured logger for serverless environments.
 *
 * Outputs JSON to stdout/stderr so Vercel Log Drains, Axiom, Datadog,
 * or any log aggregator can parse, filter, and alert on events.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.error('webhook.signature_invalid', { ip, path })
 *   logger.warn('rate_limit.exceeded', { userId, endpoint })
 *   logger.info('generate.success', { userId, model, tokens })
 */ __turbopack_context__.s([
    "getClientIp",
    ()=>getClientIp,
    "logger",
    ()=>logger
]);
function emit(level, event, meta) {
    const entry = {
        level,
        event,
        timestamp: new Date().toISOString(),
        ...meta
    };
    const line = JSON.stringify(entry);
    switch(level){
        case 'error':
            console.error(line);
            break;
        case 'warn':
            console.warn(line);
            break;
        default:
            console.log(line);
    }
}
const logger = {
    info: (event, meta)=>emit('info', event, meta),
    warn: (event, meta)=>emit('warn', event, meta),
    error: (event, meta)=>emit('error', event, meta),
    /** Convenience: log an Error object with stack trace */ exception: (event, err, meta)=>{
        const errorInfo = err instanceof Error ? {
            errorMessage: err.message,
            errorStack: err.stack
        } : {
            errorMessage: String(err)
        };
        emit('error', event, {
            ...errorInfo,
            ...meta
        });
    },
    /** Security-relevant event (auth failure, rate limit, suspicious input) */ security: (event, meta)=>emit('warn', event, {
            ...meta,
            security: true
        })
};
function getClientIp(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}
}),
"[project]/lib/supabase/proxy.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateSession",
    ()=>updateSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/logger.ts [middleware-edge] (ecmascript)");
;
;
;
async function updateSession(request) {
    let supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request
    });
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["logger"].warn('proxy.missing_env_vars', {
                route: 'middleware'
            });
            return supabaseResponse;
        }
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll () {
                    return request.cookies.getAll();
                },
                setAll (cookiesToSet) {
                    cookiesToSet.forEach(({ name, value })=>request.cookies.set(name, value));
                    supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
                        request
                    });
                    cookiesToSet.forEach(({ name, value, options })=>supabaseResponse.cookies.set(name, value, options));
                }
            }
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (request.nextUrl.pathname.startsWith('/protected') && !user) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
        if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
    } catch (e) {
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["logger"].exception('proxy.session_error', e, {
            path: request.nextUrl.pathname
        });
        return supabaseResponse;
    }
    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!
    return supabaseResponse;
}
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$proxy$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/proxy.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/logger.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
;
;
async function middleware(request) {
    try {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$proxy$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["updateSession"])(request);
    } catch (e) {
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["logger"].exception('middleware.error', e, {
            path: request.nextUrl.pathname
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
}
const config = {
    matcher: [
        '/dashboard/:path*',
        '/protected/:path*',
        /*
     * Exclude /auth/callback from middleware to avoid interfering with the
     * OAuth code exchange.  The callback route needs to run without the
     * middleware trying to refresh a session that doesn't exist yet.
     */ '/auth/login',
        '/auth/sign-up',
        '/auth/extension-connected',
        '/api/extension/:path*',
        '/api/lemonsqueezy/:path*'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__cae7d8cc._.js.map