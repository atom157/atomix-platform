const ALLOWED_ORIGINS = [
  'https://atomix.guru',
  'https://www.atomix.guru',
  'chrome-extension://jajfflglndpaipninocbcaphhkgaapog',
]

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000')
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // Allow server-to-server (no origin header)
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))
}

export function getCorsHeaders(origin: string | null) {
  // Reflect the exact origin back if it's allowed; otherwise fallback to primary
  const allowedOrigin =
    origin && isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
