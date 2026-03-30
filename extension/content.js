// AtomiX — X (Twitter) Content Script
// Injects an "AtomiX" button into every reply toolbar
// for AI-powered contextual replies (+ typewriter effect).

(function () {
  'use strict';

  const LOG = '[AtomiX X]';
  let settings = {};
  let isGenerating = false;
  const chrome = window.chrome;

  // ── Client-side rate limiting ────────────────────────────────────────────
  const RATE_LIMIT_WINDOW_MS = 60 * 1000;
  const RATE_LIMIT_MAX = 15;
  const requestTimestamps = [];

  function isRateLimited() {
    const now = Date.now();
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
      requestTimestamps.shift();
    }
    return requestTimestamps.length >= RATE_LIMIT_MAX;
  }

  function recordRequest() {
    requestTimestamps.push(Date.now());
  }

  // ── Storage helpers ──────────────────────────────────────────────────────
  const secureStorage = chrome.storage.local;

  async function loadSettings() {
    console.log(LOG, 'Loading settings...');

    // Non-sensitive settings from sync storage (mirrors discord_content.js exactly)
    const syncResult = await chrome.storage.sync.get([
      'language', 'length', 'tone', 'bannedWords', 'model',
      'includeHashtags', 'mentionAuthor', 'addEmoji',
      'selectedPromptId', 'customPromptContent',
      'selectedPromptId_x', 'customPromptContent_x'
    ]);

    // Token + userId from local storage
    const secureResult = await secureStorage.get(['extToken', 'userId']);

    console.log(LOG, 'Settings loaded:', {
      hasToken: !!secureResult.extToken,
      hasUserId: !!secureResult.userId,
      language: syncResult.language || '(default)',
      length: syncResult.length || '(default)',
      promptId: syncResult.selectedPromptId_x || syncResult.selectedPromptId || '(none)',
    });

    settings = {
      ...syncResult,
      selectedPromptId_x: syncResult.selectedPromptId_x || syncResult.selectedPromptId,
      customPromptContent_x: syncResult.customPromptContent_x || syncResult.customPromptContent,
      model: syncResult.model || 'claude-haiku-4-5-20251001',
      extToken: secureResult.extToken || null,
      userId: secureResult.userId || null,
    };

    return true;
  }

  // ── UI helpers ───────────────────────────────────────────────────────────

  function createGenerateButton() {
    const btn = document.createElement('button');
    btn.className = 'xrg-generate-btn';
    btn.innerHTML = `
      <svg class="xrg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="xrg-orb" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#BFDBFE"/>
            <stop offset="100%" stop-color="#93C5FD"/>
          </linearGradient>
        </defs>
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#xrg-orb)" stroke-width="1.3" fill="none"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#xrg-orb)" stroke-width="1.3" fill="none"
          transform="rotate(60 12 12)"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#xrg-orb)" stroke-width="1.3" fill="none"
          transform="rotate(-60 12 12)"/>
        <circle cx="12" cy="12" r="2.5" fill="white"/>
      </svg>
      <span class="xrg-text">AtomiX</span>
    `;
    btn.title = 'Generate AI Reply with AtomiX';
    return btn;
  }

  function createSpinner() {
    return `
      <svg class="xrg-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
    `;
  }

  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.xrg-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `xrg-notification xrg-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('xrg-notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Clean Author Extraction ──────────────────────────────────────────────
  // X's [data-testid="User-Name"] contains the display name AND the @handle
  // in a multi-line layout. We extract both cleanly from the structured DOM.

  function extractAuthorInfo(article) {
    const userNameEl = article.querySelector('[data-testid="User-Name"]');
    if (!userNameEl) return { author: '', handle: '' };

    // The User-Name element contains structured spans:
    // First line = display name, somewhere inside = @handle
    const allText = userNameEl.innerText || '';
    const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);

    // Display name is the first non-@ line
    let author = '';
    let handle = '';

    for (const line of lines) {
      if (line.startsWith('@')) {
        if (!handle) handle = line;
      } else if (!author && !line.startsWith('·') && !/^\d+[smhd]?$/.test(line)) {
        // Skip relative timestamps like "2h", "5m" and the · separator
        author = line;
      }
    }

    // Fallback: regex for handle if not found in lines
    if (!handle) {
      const handleMatch = allText.match(/@[\w]+/);
      if (handleMatch) handle = handleMatch[0];
    }

    return {
      author: author.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
      handle: handle.trim()
    };
  }

  // ── Smart Sniper: Context Extraction ─────────────────────────────────────
  // Extracts the target tweet text + immediate parent tweet for thread context.
  //
  // X's DOM on a tweet detail page:
  //   - All tweets are <article data-testid="tweet">
  //   - In a thread view, the tweet being replied to is ABOVE the target tweet
  //   - We grab only the immediate parent (1 tweet up), not the entire thread
  //
  // On a feed/timeline:
  //   - Each tweet is isolated — no parent context available
  //   - threadContext stays empty, which is correct

  function extractTweetData(tweetArticle) {
    console.log(LOG, 'Extracting tweet context...');

    // ── 1. Target tweet text (data-testid only) ──
    const tweetTextEl = tweetArticle.querySelector('[data-testid="tweetText"]');
    const tweetText = tweetTextEl ? tweetTextEl.innerText.trim() : '';

    // ── 2. Author info ──
    const { author, handle } = extractAuthorInfo(tweetArticle);

    // ── 3. Engagement metrics (data-testid only) ──
    const metrics = {};
    const replyBtn = tweetArticle.querySelector('[data-testid="reply"]');
    const retweetBtn = tweetArticle.querySelector('[data-testid="retweet"]');
    const likeBtn = tweetArticle.querySelector('[data-testid="like"]') ||
      tweetArticle.querySelector('[data-testid="unlike"]');

    if (replyBtn) metrics.replies = replyBtn.innerText || '0';
    if (retweetBtn) metrics.retweets = retweetBtn.innerText || '0';
    if (likeBtn) metrics.likes = likeBtn.innerText || '0';

    // ── 4. Smart Sniper: Thread parent context ──
    // On a tweet detail page, all tweets are <article data-testid="tweet">.
    // We find all articles on the page, locate the target, and grab the one above it.
    const threadContext = [];
    const allArticles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
    const targetIndex = allArticles.indexOf(tweetArticle);

    if (targetIndex > 0) {
      // Grab the immediate parent tweet (one above)
      const parentArticle = allArticles[targetIndex - 1];
      const parentTextEl = parentArticle.querySelector('[data-testid="tweetText"]');
      const parentText = parentTextEl ? parentTextEl.innerText.trim() : '';

      if (parentText) {
        const { author: parentAuthor } = extractAuthorInfo(parentArticle);
        threadContext.push({
          author: parentAuthor,
          text: parentText
        });
        console.log(LOG, 'Parent tweet captured:', parentText.substring(0, 80));
      }
    }

    // ── 5. Substance check ──
    // If the target tweet has no real substance (just emoji, "lol", a GIF, etc.),
    // and we have parent context, merge the parent text into the main text
    // so the AI has enough context to generate a meaningful reply.
    let finalText = tweetText;
    const hasSubstance = tweetText.length > 15 ||
      /\?|how|what|why|who|where|when|як|що|чому|хто|где|как|зачем|почему/.test(tweetText.toLowerCase());

    if (!hasSubstance && threadContext.length > 0) {
      // Low-substance target — merge parent context into the main text
      const parentParts = threadContext.map(m => `${m.author}: ${m.text}`);
      parentParts.push(tweetText || '[media/emoji]');
      finalText = parentParts.join(' \n ');
      console.log(LOG, 'Low-substance tweet detected — context merged:', finalText.substring(0, 120));
    }

    // Phantom content detection: media-only tweets
    if (!finalText) {
      const hasImage = tweetArticle.querySelector('[data-testid="tweetPhoto"]');
      const hasVideo = tweetArticle.querySelector('[data-testid="videoPlayer"]');
      const hasCard = tweetArticle.querySelector('[data-testid="card.wrapper"]');

      if (hasImage) finalText = '[image]';
      else if (hasVideo) finalText = '[video]';
      else if (hasCard) finalText = '[link card]';
    }

    const result = {
      text: finalText,
      author: author,
      handle: handle,
      metrics: metrics,
      threadContext: threadContext
    };

    console.log(LOG, 'Context extracted:', JSON.stringify(result, null, 2));
    return result;
  }

  // ── Generate reply via background.js ─────────────────────────────────────
  //
  // [CHROME WEB STORE REVIEWER NOTE]
  // 1. Architecture: Content scripts run in the x.com page context and are subject to
  //    x.com's Content-Security-Policy, which blocks direct API calls. The Service Worker
  //    acts as a proxy to communicate securely with our backend at api.atomix.guru.
  // 2. Payments: Monetization (PRO tier) is processed strictly through a secure third-party
  //    payment provider (Lava.top). Billing logic runs entirely on the backend API.
  //    The extension only sends the user's secure token (`extToken`) to authenticate.

  async function generateReply(tweetData) {
    if (!settings.extToken || !settings.userId) {
      throw new Error('Please connect your account in extension settings');
    }

    if (isRateLimited()) {
      throw new Error('Too many requests. Please wait a moment.');
    }

    recordRequest();

    const payloadObject = {
      tweetData,
      extToken: settings.extToken,
      promptId: settings.selectedPromptId_x || null,
      settings: {
        model: settings.model,
        language: settings.language || 'same',
        length: settings.length || 'medium',
        tone: settings.tone || 'friendly',
        bannedWords: settings.bannedWords || '',
        includeHashtags: settings.includeHashtags || false,
        mentionAuthor: settings.mentionAuthor || false,
        addEmoji: settings.addEmoji || false,
        customPrompt: settings.customPromptContent_x || null,
        platform: 'x'
      },
    };

    console.log('[AtomiX Debug] Final Payload:', JSON.stringify(payloadObject, null, 2));

    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'GENERATE_REPLY',
          payload: payloadObject,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error('Extension background error: ' + chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        }
      );
    });

    if (!result.ok) {
      if (result.status === 401) {
        await secureStorage.remove(['extToken', 'userId']);
        throw new Error('Session expired. Please reconnect in the extension popup.');
      }
      throw new Error(result.error || 'API Error');
    }

    // ── Sync updated quotas to chrome.storage so popup reflects real-time state ──
    if (result.usage) {
      chrome.storage.local.set({
        cachedPlan: result.usage.tier || 'free',
        cachedDaily: result.usage.daily_remaining || 0,
        cachedMonthly: result.usage.monthly_remaining || 0,
        cachedInitial: result.usage.initial_remaining || 0,
        cachedTotal: result.usage.total_remaining || 0,
      });
    }

    console.log(LOG, 'Generation received, length:', result.reply?.length);
    return result.reply;
  }

  // ── Insert reply into X's Draft.js editor ────────────────────────────────
  //
  // IMPLEMENTATION (iteration 7 — Native Typewriter):
  //   Uses per-character execCommand('insertText', false, char) with a
  //   randomized 20-50ms delay between each character. This mimics real
  //   human typing speed directly inside Draft.js's native text handling.
  //
  //   Each character insertion fires input + change events to keep Draft.js
  //   EditorState synced in real-time (Reply button activates, cursor moves).
  //
  //   An interruption guard watches for user keydown/mousedown on the editor.
  //   If the user starts typing or clicks, the AI typing loop immediately
  //   aborts to prevent state corruption. Whatever was typed so far stays.
  //
  //   CRITICAL: cursor must be collapsed to END before starting.
  //   selectNodeContents without collapse selects the entire Draft.js node
  //   tree, and the first insertText would REPLACE it rather than appending.
  //
  //   FALLBACK CHAIN (if char-by-char fails):
  //     1. Single-shot execCommand('insertText', false, fullText)
  //     2. Synthetic paste via ClipboardEvent + DataTransfer
  //     3. Copy to clipboard for manual Ctrl+V

  async function insertReply(text) {
    const editor = document.querySelector('[data-testid="tweetTextarea_0"]') ||
      document.querySelector('[contenteditable="true"][role="textbox"]');

    if (!editor) {
      return false;
    }

    try {
      editor.focus();
      await sleep(150);

      // ── Collapse cursor to end of editor ──
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      await sleep(50);

      // ── Interruption guard ──
      // If the user clicks or types during AI typing, abort immediately.
      let interrupted = false;
      const onInterrupt = () => { interrupted = true; };
      editor.addEventListener('keydown', onInterrupt, { once: false });
      editor.addEventListener('mousedown', onInterrupt, { once: false });

      // ── Char-by-char native typewriter ──
      let charsFailed = false;
      for (let i = 0; i < text.length; i++) {
        if (interrupted) {
          console.log(LOG, 'Typing interrupted by user at char', i);
          break;
        }

        const ok = document.execCommand('insertText', false, text[i]);
        if (!ok) {
          console.warn(LOG, 'execCommand failed at char', i, '— falling back to single-shot');
          charsFailed = true;
          break;
        }

        // Sync Draft.js state after each character
        editor.dispatchEvent(new Event('input', { bubbles: true }));

        // Dynamic delay: 20-50ms randomized to mimic human typing
        const delay = Math.floor(Math.random() * 30) + 20;
        await sleep(delay);
      }

      // Cleanup listeners
      editor.removeEventListener('keydown', onInterrupt);
      editor.removeEventListener('mousedown', onInterrupt);

      // If char-by-char succeeded (or was just interrupted mid-way), we're done
      if (!charsFailed) {
        // Final event flush to ensure Reply button activates
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(LOG, interrupted
          ? 'Typewriter interrupted — partial text kept'
          : 'Typewriter insertion complete');
        return true;
      }

      // ── FALLBACK 1: Single-shot insert ──
      // Clear whatever partial chars were inserted, then do atomic insert
      console.log(LOG, 'Falling back to single-shot insert...');
      range.selectNodeContents(editor);
      selection.removeAllRanges();
      selection.addRange(range);
      const inserted = document.execCommand('insertText', false, text);

      if (inserted && editor.textContent.includes(text.substring(0, 10))) {
        console.log(LOG, 'Single-shot fallback successful');
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // ── FALLBACK 2: Synthetic paste via ClipboardEvent ──
      console.log(LOG, 'Single-shot failed, trying synthetic paste...');
      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer
        });
        editor.dispatchEvent(pasteEvent);
        await sleep(100);

        if (editor.textContent.includes(text.substring(0, 10))) {
          console.log(LOG, 'Synthetic paste successful');
          return true;
        }
      } catch (pasteErr) {
        console.warn(LOG, 'Synthetic paste failed:', pasteErr);
      }

      // ── FALLBACK 3: Clipboard for manual Ctrl+V ──
      await navigator.clipboard.writeText(text);
      return false;
    } catch (error) {
      console.error(LOG, 'Insert error:', error);
      try { await navigator.clipboard.writeText(text); } catch (_) { }
      return false;
    }
  }

  // ── Button click handler ─────────────────────────────────────────────────

  async function handleGenerateClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isGenerating) return;

    const btn = event.currentTarget;
    console.log(LOG, 'AtomiX button clicked');

    // Walk up from the button's toolbar to find the relevant tweet article
    // The toolbar lives inside the tweet article, or near a reply box
    let tweetArticle = btn.closest('article[data-testid="tweet"]') ||
      btn.closest('article');

    // If button is in a reply box (not inside any article), find the tweet being replied to
    if (!tweetArticle) {
      // On a single-tweet page, grab the main (first) tweet
      tweetArticle = document.querySelector('article[data-testid="tweet"]');
    }

    console.log(LOG, 'Tweet article found:', !!tweetArticle);

    if (!tweetArticle) {
      showNotification('Could not find tweet', 'error');
      return;
    }

    let tweetData = extractTweetData(tweetArticle);

    // Fallback: if scraper got no text at all, try grabbing any visible tweetText on the page
    if (!tweetData || !tweetData.text) {
      console.warn(LOG, 'Primary scrape failed, trying fallback...');
      const fallbackTextEl = document.querySelector('[data-testid="tweetText"]');
      if (fallbackTextEl && fallbackTextEl.innerText.trim()) {
        tweetData = {
          text: fallbackTextEl.innerText.trim(),
          author: 'Unknown',
          handle: '',
          metrics: {},
          threadContext: []
        };
        console.log(LOG, 'Fallback tweet data:', tweetData.text.substring(0, 80));
      } else {
        showNotification('Could not read tweet text', 'error');
        return;
      }
    }

    isGenerating = true;
    const originalContent = btn.innerHTML;
    btn.innerHTML = `${createSpinner()}<span class="xrg-text">Generating...</span>`;
    btn.classList.add('xrg-loading');

    try {
      await loadSettings();
      const reply = await generateReply(tweetData);

      if (reply) {
        btn.innerHTML = `${createSpinner()}<span class="xrg-text">Typing...</span>`;

        const inserted = await insertReply(reply);

        if (inserted) {
          showNotification('Reply generated!', 'success');
          console.log(LOG, 'Reply workflow complete');
        } else {
          await navigator.clipboard.writeText(reply);
          showNotification('Copied to clipboard! Press Ctrl+V', 'success');
          console.log(LOG, 'Clipboard fallback used');
        }
      }
    } catch (error) {
      console.error(LOG, 'Error:', error);
      showNotification(error.message, 'error');
    } finally {
      isGenerating = false;
      btn.innerHTML = originalContent;
      btn.classList.remove('xrg-loading');
    }
  }

  // ── Toolbar injection ────────────────────────────────────────────────────
  // Uses data-testid="toolBar" exclusively — no class selectors.

  function injectButtons() {
    const replyToolbars = document.querySelectorAll('[data-testid="toolBar"]');

    replyToolbars.forEach(toolbar => {
      if (toolbar.querySelector('.xrg-generate-btn')) return;

      const btn = createGenerateButton();
      btn.addEventListener('click', handleGenerateClick);
      toolbar.insertBefore(btn, toolbar.firstChild);
    });
  }

  // ── Initialize ───────────────────────────────────────────────────────────

  async function init() {
    await loadSettings();
    injectButtons();

    const observer = new MutationObserver((mutations) => {
      let shouldInject = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldInject = true;
          break;
        }
      }

      if (shouldInject) {
        clearTimeout(window.xrgInjectTimeout);
        window.xrgInjectTimeout = setTimeout(injectButtons, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log(LOG, 'Extension loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
