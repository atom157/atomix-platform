// X Reply Generator - Content Script

(function () {
  'use strict';

  let settings = {};
  let isGenerating = false;
  const API_BASE = 'https://atomix.guru';
  const chrome = window.chrome; // Declare the chrome variable

  // --- Client-side rate limiting ---
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const RATE_LIMIT_MAX = 15; // max requests per window
  const requestTimestamps = [];

  function isRateLimited() {
    const now = Date.now();
    // Remove timestamps outside the window
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
      requestTimestamps.shift();
    }
    return requestTimestamps.length >= RATE_LIMIT_MAX;
  }

  function recordRequest() {
    requestTimestamps.push(Date.now());
  }

  // --- Storage helpers ---
  // Content scripts can ONLY use local storage (not session)
  const secureStorage = chrome.storage.local;

  // Load settings from storage
  async function loadSettings() {
    console.log('[CONTENT] Loading settings...');

    // Load non-sensitive settings from sync
    const syncResult = await chrome.storage.sync.get([
      'language',
      'length',
      'bannedWords',
      'includeHashtags',
      'mentionAuthor',
      'addEmoji',
      'selectedPromptId',
      'customPromptContent'
    ]);

    // Load token from LOCAL storage
    const secureResult = await secureStorage.get(['extToken', 'userId']);

    console.log('[CONTENT] Token loaded:', {
      hasToken: !!secureResult.extToken,
      hasUserId: !!secureResult.userId
    });

    settings = {
      ...syncResult,
      extToken: secureResult.extToken || null,
      userId: secureResult.userId || null,
    };

    return true;
  }

  // Create generate button — AtomiX branded with atom icon
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
        <!-- Orbital ring 1 -->
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#xrg-orb)" stroke-width="1.3" fill="none"/>
        <!-- Orbital ring 2 -->
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#xrg-orb)" stroke-width="1.3" fill="none"
          transform="rotate(60 12 12)"/>
        <!-- Orbital ring 3 -->
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#xrg-orb)" stroke-width="1.3" fill="none"
          transform="rotate(-60 12 12)"/>
        <!-- Nucleus -->
        <circle cx="12" cy="12" r="2.5" fill="white"/>
      </svg>
      <span class="xrg-text">AtomiX</span>
    `;
    btn.title = 'Generate AI Reply with AtomiX';
    return btn;
  }

  // Create loading spinner
  function createSpinner() {
    return `
      <svg class="xrg-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
    `;
  }

  // Extract tweet data from the page
  function extractTweetData(tweetElement) {
    // Try multiple selectors for the tweet article
    const article = tweetElement.closest('article') ||
      tweetElement.closest('[data-testid="tweet"]') ||
      tweetElement.closest('[data-testid="tweetDetail"]') ||
      document.querySelector('article[data-testid="tweet"]');

    if (!article) {
      console.warn('[XRG] No article element found near button');
      return null;
    }

    // Tweet text — try multiple selectors
    const tweetTextEl = article.querySelector('[data-testid="tweetText"]') ||
      article.querySelector('[lang]') ||
      article.querySelector('div[dir="auto"]');
    const tweetText = tweetTextEl ? tweetTextEl.innerText.trim() : '';

    // Author name
    const authorEl = article.querySelector('[data-testid="User-Name"]');
    const authorName = authorEl ? authorEl.innerText.split('\n')[0] : '';

    // Author handle
    const handleMatch = authorEl ? authorEl.innerText.match(/@[\w]+/) : null;
    const authorHandle = handleMatch ? handleMatch[0] : '';

    // Engagement metrics
    const metrics = {};
    const replyCount = article.querySelector('[data-testid="reply"]');
    const retweetCount = article.querySelector('[data-testid="retweet"]');
    const likeCount = article.querySelector('[data-testid="like"]');

    if (replyCount) metrics.replies = replyCount.innerText || '0';
    if (retweetCount) metrics.retweets = retweetCount.innerText || '0';
    if (likeCount) metrics.likes = likeCount.innerText || '0';

    // Thread context
    let threadContext = [];
    const conversationThread = document.querySelectorAll('article[data-testid="tweet"]');
    conversationThread.forEach((tweet, index) => {
      const text = tweet.querySelector('[data-testid="tweetText"]');
      if (text && index < 5) {
        threadContext.push(text.innerText);
      }
    });

    const result = {
      text: tweetText,
      author: authorName,
      handle: authorHandle,
      metrics,
      threadContext: threadContext.slice(0, -1)
    };

    console.log('[XRG] Scraped Tweet Data:', JSON.stringify(result, null, 2));
    console.log('[XRG] Text found:', !!tweetText, '| Author:', authorName, '| Handle:', authorHandle);

    return result;
  }

  // Generate reply — delegates fetch to the background Service Worker.
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

    // Client-side rate limiting
    if (isRateLimited()) {
      throw new Error('Too many requests. Please wait a moment.');
    }

    recordRequest();

    // Send message to background.js — it performs the actual fetch()
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'GENERATE_REPLY',
          payload: {
            tweetData,
            extToken: settings.extToken,
            promptId: settings.selectedPromptId || null,
            settings: {
              model: 'gpt-4o-mini',
              language: settings.language || 'same',
              length: settings.length || 'medium',
              bannedWords: settings.bannedWords || '',
              includeHashtags: settings.includeHashtags || false,
              mentionAuthor: settings.mentionAuthor || false,
              addEmoji: settings.addEmoji || false,
              customPrompt: settings.customPromptContent || null
            },
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Service worker not running / crashed — ask user to reload the tab
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

    return result.reply;
  }

  // ── Insert reply into X's Draft.js editor ────────────────────────────────────
  //
  // ROOT CAUSE of all previous failures:
  //   Manual DOM selection manipulation (createRange / addRange) permanently
  //   desyncs Draft.js's internal SelectionState. Draft.js then thinks the
  //   editor is empty, so Backspace and the Reply button break.
  //
  // SOLUTION:  Never touch the DOM selection directly.
  //   • Use ONLY execCommand() for select/delete/insert — these fire native
  //     beforeinput events that Draft.js intercepts and handles properly.
  //   • If execCommand fails, fall back to React Fiber introspection to call
  //     Draft.js's internal handlers directly.
  //   • Typewriter effect: insert character-by-character with random delays.
  //
  async function insertReply(text) {
    const editor = document.querySelector('[data-testid="tweetTextarea_0"]') ||
      document.querySelector('[contenteditable="true"][role="textbox"]');

    if (!editor) {
      return false;
    }

    try {
      // ── Step 1: Focus the editor (required for all methods) ──
      editor.focus();
      await sleep(120);

      // ── Step 2: Clear existing content using ONLY execCommand ──
      // Do NOT use createRange / addRange — that desyncs Draft.js.
      document.execCommand('selectAll', false, null);
      await sleep(30);
      document.execCommand('delete', false, null);
      await sleep(60);

      // Re-focus in case delete blurred
      editor.focus();
      await sleep(30);

      // ── Step 3: Try character-by-character insertion ──
      let success = false;

      // --- Approach A: Pure execCommand per character ---
      // execCommand('insertText') fires a native beforeinput event in Chrome.
      // Draft.js intercepts beforeinput, updates its EditorState, and re-renders.
      // We must NOT dispatch any extra synthetic events — they interfere.
      success = await typewriterExecCommand(editor, text);

      // --- Approach B: React Fiber introspection fallback ---
      if (!success) {
        console.log('[XRG] execCommand failed, trying React Fiber approach...');
        success = await typewriterReactFiber(editor, text);
      }

      // --- Approach C: Bulk TextEvent fallback ---
      if (!success) {
        console.log('[XRG] React Fiber failed, trying TextEvent...');
        try {
          editor.focus();
          const textEvent = document.createEvent('TextEvent');
          textEvent.initTextEvent('textInput', true, true, window, text);
          editor.dispatchEvent(textEvent);
          await sleep(50);
          success = editor.textContent.includes(text.substring(0, 10));
        } catch (e) {
          console.warn('[XRG] TextEvent not supported');
        }
      }

      if (success) {
        return true;
      }

      // --- Last resort: clipboard ---
      await navigator.clipboard.writeText(text);
      return false;
    } catch (error) {
      console.error('[XRG] Insert error:', error);
      try { await navigator.clipboard.writeText(text); } catch (_) { }
      return false;
    }
  }

  // ── Approach A: Pure execCommand typewriter ─────────────────────────────────
  // No synthetic events, no manual selection. Just execCommand which fires
  // native beforeinput that Draft.js handles.
  async function typewriterExecCommand(editor, text) {
    for (let i = 0; i < text.length; i++) {
      // Ensure focus before each character (Draft.js may blur on re-render)
      if (document.activeElement !== editor) {
        editor.focus();
        await sleep(10);
      }

      const ok = document.execCommand('insertText', false, text[i]);

      if (!ok) {
        console.warn('[XRG] execCommand failed at char', i);
        return false;
      }

      // Random 15–45ms delay for human-like typing
      await sleep(Math.floor(Math.random() * 30) + 15);
    }

    await sleep(50);
    return editor.textContent.includes(text.substring(0, 10));
  }

  // ── Approach B: React Fiber introspection ───────────────────────────────────
  // Finds Draft.js's internal React props on the DOM node and calls
  // onBeforeInput directly, fully syncing the EditorState.
  async function typewriterReactFiber(editor, text) {
    // Find the React internal properties on the editor or its parent
    const target = findReactPropsNode(editor);
    if (!target) {
      console.warn('[XRG] Could not find React props on editor');
      return false;
    }

    const propsKey = Object.keys(target).find(k => k.startsWith('__reactProps$'));
    const props = target[propsKey];

    if (!props || !props.onBeforeInput) {
      console.warn('[XRG] No onBeforeInput handler found');
      return false;
    }

    console.log('[XRG] Found Draft.js onBeforeInput handler, using Fiber approach');

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      editor.focus();

      // Build a minimal event-like object that Draft.js's onBeforeInput expects
      const fakeEvent = {
        data: char,
        preventDefault: () => { },
        stopPropagation: () => { },
        nativeEvent: { data: char, inputType: 'insertText', preventDefault: () => { } },
        type: 'beforeinput',
        target: editor,
        currentTarget: editor,
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        timeStamp: Date.now(),
        isDefaultPrevented: () => false,
        isPropagationStopped: () => false,
        persist: () => { },
      };

      try {
        props.onBeforeInput(fakeEvent);
      } catch (e) {
        console.warn('[XRG] onBeforeInput threw:', e.message);
        return false;
      }

      // Random 15–45ms delay for human-like typing
      await sleep(Math.floor(Math.random() * 30) + 15);
    }

    await sleep(50);
    return editor.textContent.includes(text.substring(0, 10));
  }

  // Walk up from the editor node to find the first element with __reactProps$
  function findReactPropsNode(node) {
    let current = node;
    for (let i = 0; i < 10 && current; i++) {
      const propsKey = Object.keys(current).find(k => k.startsWith('__reactProps$'));
      if (propsKey && current[propsKey]?.onBeforeInput) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Handle generate button click
  async function handleGenerateClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isGenerating) return;

    const btn = event.currentTarget;

    // Walk up from the button's toolbar to find the relevant tweet
    // The toolbar lives inside the tweet article, or near a reply box
    let tweetArticle = btn.closest('article[data-testid="tweet"]') ||
      btn.closest('article');

    // If button is in a reply box (not inside any article), find the tweet being replied to
    if (!tweetArticle) {
      // On a single-tweet page, grab the main (first) tweet
      tweetArticle = document.querySelector('[data-testid="tweet"]') ||
        document.querySelector('article[role="article"]') ||
        document.querySelector('article');
    }

    console.log('[XRG] Tweet article found:', !!tweetArticle, tweetArticle?.getAttribute?.('data-testid'));

    if (!tweetArticle) {
      showNotification('Could not find tweet', 'error');
      return;
    }

    let tweetData = extractTweetData(tweetArticle);

    // Fallback: if scraper got no text, try grabbing any visible tweet text on the page
    if (!tweetData || !tweetData.text) {
      console.warn('[XRG] Primary scrape failed, trying fallback...');
      const fallbackText = document.querySelector('[data-testid="tweetText"]');
      if (fallbackText && fallbackText.innerText.trim()) {
        tweetData = {
          text: fallbackText.innerText.trim(),
          author: 'Unknown',
          handle: '',
          metrics: {},
          threadContext: []
        };
        console.log('[XRG] Fallback tweet data:', tweetData.text.substring(0, 80));
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
        // Show "Typing..." state while the typewriter effect runs
        btn.innerHTML = `${createSpinner()}<span class="xrg-text">Typing...</span>`;

        const inserted = await insertReply(reply);

        if (inserted) {
          showNotification('Reply generated!', 'success');
        } else {
          await navigator.clipboard.writeText(reply);
          showNotification('Copied to clipboard! Press Ctrl+V', 'success');
        }
      }
    } catch (error) {
      console.error('[XRG] Error:', error);
      showNotification(error.message, 'error');
    } finally {
      isGenerating = false;
      btn.innerHTML = originalContent;
      btn.classList.remove('xrg-loading');
    }
  }

  // Show notification
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

  // Inject button into reply boxes
  function injectButtons() {
    const replyToolbars = document.querySelectorAll('[data-testid="toolBar"]');

    replyToolbars.forEach(toolbar => {
      if (toolbar.querySelector('.xrg-generate-btn')) return;

      const btn = createGenerateButton();
      btn.addEventListener('click', handleGenerateClick);
      toolbar.insertBefore(btn, toolbar.firstChild);
    });
  }

  // Initialize
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

    console.log('[XRG] Extension loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
