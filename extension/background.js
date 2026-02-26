// X Reply Generator - Background Service Worker (MV3)
// ---------------------------------------------------------------------------
// WHY THIS FILE EXISTS:
//   Content scripts run inside the host page context (x.com).
//   x.com has a strict Content-Security-Policy that blocks any fetch() call
//   to external origins not listed in ITS OWN CSP — regardless of what
//   host_permissions says in our manifest.
//
//   Service Workers run in the EXTENSION context, which is completely
//   isolated from the host page's CSP. They can reach any origin that
//   is listed in host_permissions. That's why we proxy the API call here.
// ---------------------------------------------------------------------------

import { trackEvent } from './posthog-api.js';

const API_BASE = 'https://www.atomix.guru';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    trackEvent('extension_installed');
    chrome.tabs.create({ url: 'https://atomix.guru/welcome' });
  }
});

// ── Message router ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only accept messages from our own content scripts / popup
  if (sender.id !== chrome.runtime.id) return;

  switch (message.type) {
    case 'GENERATE_REPLY':
      handleGenerateReply(message.payload, sendResponse);
      return true; // keep channel open for async sendResponse

    case 'FETCH_PROMPTS':
      handleFetchPrompts(message.payload, sendResponse);
      return true;

    case 'EXTRACT_TOKEN':
      handleExtractToken(sendResponse);
      return true;

    default:
      sendResponse({ ok: false, error: 'Unknown message type' });
  }
});

// ── Generate reply ───────────────────────────────────────────────────────────
async function handleGenerateReply({ tweetData, settings, extToken, promptId }, sendResponse) {
  try {
    const response = await fetch(`${API_BASE}/api/extension/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${extToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ tweetData, promptId: promptId || null, settings }),
    });

    // Handle 401 explicitly so content.js can clear the token
    if (response.status === 401) {
      sendResponse({ ok: false, status: 401, error: 'Session expired. Please reconnect.' });
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      sendResponse({ ok: false, status: response.status, error: data.error || 'API Error' });
      return;
    }

    sendResponse({ ok: true, reply: data.reply });

    // Background async tracking
    trackEvent('reply_generated', {
      length: settings?.length || 'medium',
      language: settings?.language || 'en'
    });
  } catch (err) {
    // Network-level error (DNS failure, SSL, offline, etc.)
    console.error('[BG] generateReply error:', err);
    sendResponse({ ok: false, error: err.message || 'Network error' });
  }
}

// ── Fetch prompts (used by popup) ────────────────────────────────────────────
async function handleFetchPrompts({ extToken }, sendResponse) {
  try {
    const response = await fetch(`${API_BASE}/api/extension/prompts`, {
      headers: { 'Authorization': `Bearer ${extToken}` },
      credentials: 'include',
    });

    if (response.status === 401) {
      sendResponse({ ok: false, status: 401, error: 'Session expired.' });
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      sendResponse({ ok: false, error: data.error || 'API Error' });
      return;
    }

    sendResponse({ ok: true, data });
  } catch (err) {
    console.error('[BG] fetchPrompts error:', err);
    sendResponse({ ok: false, error: err.message || 'Network error' });
  }
}

// ── Extract Token Directly via Background Fetch ──────────────────────────────
async function handleExtractToken(sendResponse) {
  try {
    const response = await fetch(`${API_BASE}/api/extension/token`, {
      method: 'POST',
      credentials: 'include' // CRITICAL: This passes the HTTP-only Supabase auth cookies!
    });

    if (response.status === 401 || !response.ok) {
      sendResponse({ ok: false, status: response.status, error: 'Not authenticated on atomix.guru' });
      return;
    }

    const data = await response.json();

    if (data && data.token && data.userId) {
      // Background script stores it instantly
      chrome.storage.local.set({ extToken: data.token, userId: data.userId }, () => {
        chrome.storage.sync.set({ userId: data.userId, isConnected: true }, () => {
          sendResponse({ ok: true, token: data.token, userId: data.userId });
        });
      });
    } else {
      sendResponse({ ok: false, error: 'Malformed token response' });
    }
  } catch (err) {
    console.error('[BG] extractToken error:', err);
    sendResponse({ ok: false, error: err.message || 'Network error' });
  }
}

console.log('[BG] Service Worker registered ✅');
