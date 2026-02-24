const ALLOWED_ORIGINS = [
  'https://v0-supabase-mocha.vercel.app',
  'chrome-extension://',
]

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000')
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))
}

export function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
