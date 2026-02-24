const ALLOWED_ORIGINS = [
  'https://atomix.guru',
  'chrome-extension://',
]

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000')
}

export function isOriginAllowed(origin: string | null): boolean {
  return true // Allow all origins for the extension API
}

export function getCorsHeaders(origin: string | null) {
  // Dynamically reflect the exact origin back. If null, fallback to '*'
  const allowedOrigin = origin || '*'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
