// AtomiX — Discord Content Script
// Injects an "AtomiX" button into Discord's message hover toolbar,
// extracts message context, triggers native Reply, generates an AI reply
// via background.js, and injects the result into Discord's Slate.js editor
// with a character-by-character typewriter effect.

(function () {
  'use strict';

  const LOG = '[AtomiX Discord]';
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

    // Non-sensitive settings from sync storage (mirrors content.js exactly)
    const syncResult = await chrome.storage.sync.get([
      'language', 'length', 'bannedWords', 'includeHashtags',
      'mentionAuthor', 'addEmoji', 'selectedPromptId', 'customPromptContent'
    ]);

    // Token + userId from local storage
    const secureResult = await secureStorage.get(['extToken', 'userId']);

    console.log(LOG, 'Settings loaded:', {
      hasToken: !!secureResult.extToken,
      hasUserId: !!secureResult.userId,
      language: syncResult.language || '(default)',
      length: syncResult.length || '(default)',
      promptId: syncResult.selectedPromptId || '(none)',
    });

    settings = {
      ...syncResult,
      extToken: secureResult.extToken || null,
      userId: secureResult.userId || null,
    };

    return true;
  }

  // ── UI helpers ───────────────────────────────────────────────────────────

  function createAtomixButton() {
    const btn = document.createElement('button');
    btn.className = 'atomix-discord-btn';
    btn.setAttribute('data-atomix-btn', 'true');
    btn.setAttribute('aria-label', 'Generate AI reply with AtomiX');
    btn.innerHTML = `
      <svg class="atomix-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="atomix-orb-discord" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#8B9FFF"/>
            <stop offset="100%" stop-color="#5865F2"/>
          </linearGradient>
        </defs>
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#atomix-orb-discord)" stroke-width="1.3" fill="none"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#atomix-orb-discord)" stroke-width="1.3" fill="none" transform="rotate(60 12 12)"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="url(#atomix-orb-discord)" stroke-width="1.3" fill="none" transform="rotate(-60 12 12)"/>
        <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
      </svg>
      <span class="atomix-label">AtomiX</span>
    `;
    btn.title = 'Generate AI Reply with AtomiX';
    return btn;
  }

  function createSpinner() {
    return `
      <svg class="atomix-discord-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
    `;
  }

  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.atomix-discord-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `atomix-discord-notification atomix-discord-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('atomix-discord-notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Toolbar discovery (structural heuristic) ──────────────────────────────
  //
  // Discord's hover toolbar is a short-lived container with a few (3-5)
  // child elements, each wrapping an SVG icon. It floats over the message
  // via absolute/fixed positioning. We find it by structure, not by
  // specific IDs, classes, or aria-labels — making this approach resilient
  // to Discord updates and locale changes.

  function findHoverToolbars() {
    const toolbars = [];

    // Strategy A: id="message-actions-{snowflake}" (most direct if present)
    document.querySelectorAll('[id^="message-actions-"]').forEach(el => {
      toolbars.push({ el, source: 'id:message-actions' });
    });

    // Strategy B: Structural heuristic for the floating toolbar.
    // Look for containers that:
    //   1. Have 2-6 direct children
    //   2. Most/all children contain an <svg>
    //   3. Container or its parent has position: absolute or fixed
    //   4. Container is NOT a <li>, <ol>, <ul>, <nav>, <main>
    // This identifies the "icon button row" pattern.
    const candidates = document.querySelectorAll('div[class]');
    for (const div of candidates) {
      const kids = div.children;
      if (kids.length < 2 || kids.length > 8) continue;

      // Skip if it's clearly not a toolbar
      const tag = div.tagName.toLowerCase();
      if (['li', 'ol', 'ul', 'nav', 'main', 'section', 'article'].includes(tag)) continue;

      // Count how many children contain an SVG
      let svgCount = 0;
      for (const kid of kids) {
        if (kid.querySelector('svg') || kid.tagName === 'SVG') svgCount++;
      }

      // At least half the children should have SVGs (icon buttons)
      if (svgCount < 2 || svgCount < kids.length * 0.5) continue;

      // Check positioning — the toolbar floats
      const style = getComputedStyle(div);
      const parentStyle = div.parentElement ? getComputedStyle(div.parentElement) : null;
      const isFloating = ['absolute', 'fixed'].includes(style.position)
        || (parentStyle && ['absolute', 'fixed'].includes(parentStyle.position));

      if (!isFloating) continue;

      // Skip items already accounted for by Strategy A
      if (div.id && div.id.startsWith('message-actions-')) continue;
      if (div.closest('[id^="message-actions-"]')) continue;

      toolbars.push({ el: div, source: 'structural-heuristic' });
    }

    return toolbars;
  }

  // Diagnostic: log toolbar details so user can debug
  function dumpToolbarInfo(toolbar, source) {
    const el = toolbar;
    const kids = Array.from(el.children);
    const info = {
      source,
      tag: el.tagName,
      id: el.id || '(none)',
      className: (el.className || '').toString().substring(0, 80),
      childCount: kids.length,
      children: kids.map((k, i) => ({
        index: i,
        tag: k.tagName,
        ariaLabel: k.getAttribute('aria-label') || '(none)',
        hasSvg: !!k.querySelector('svg'),
        svgPaths: Array.from(k.querySelectorAll('svg path')).map(p =>
          (p.getAttribute('d') || '').substring(0, 30) + '...'
        )
      }))
    };
    console.log(LOG, 'Toolbar found:', JSON.stringify(info, null, 2));
  }

  // ── Message extraction ───────────────────────────────────────────────────

  function extractMessageData(buttonElement) {
    console.log(LOG, 'Extracting message context...');

    // Walk up to the message list item
    const listItem = buttonElement.closest('[id^="chat-messages-"]')
      || buttonElement.closest('li');

    if (!listItem) {
      console.warn(LOG, 'Could not find message list item');
      return null;
    }

    console.log(LOG, 'Message container:', listItem.id || '(no id)');

    // Extract message text
    let messageText = '';
    const contentEl = listItem.querySelector('[id^="message-content-"]');
    if (contentEl) {
      messageText = contentEl.innerText.trim();
      console.log(LOG, 'Text found via [id^=message-content-]');
    }

    if (!messageText) {
      const markup = listItem.querySelector('[class*="markup_"], [class*="messageContent_"]');
      if (markup) {
        messageText = markup.innerText.trim();
        console.log(LOG, 'Text found via class fallback');
      }
    }

    if (!messageText) {
      const lines = listItem.innerText.split('\n').filter(l => l.trim().length > 3);
      if (lines.length > 0) {
        messageText = lines.reduce((a, b) => a.length >= b.length ? a : b).trim();
        console.log(LOG, 'Text found via innerText heuristic');
      }
    }

    // Extract author
    let authorName = '';
    const usernameEl = listItem.querySelector('[id^="message-username-"]');
    if (usernameEl) {
      authorName = usernameEl.innerText.trim();
    }

    if (!authorName) {
      let sibling = listItem.previousElementSibling;
      let attempts = 0;
      while (sibling && attempts < 10) {
        const h = sibling.querySelector('[id^="message-username-"]');
        if (h) { authorName = h.innerText.trim(); break; }
        sibling = sibling.previousElementSibling;
        attempts++;
      }
    }

    const result = {
      text: messageText,
      author: authorName,
      handle: '',
      metrics: {},
      threadContext: []
    };

    console.log(LOG, 'Context extracted:', JSON.stringify(result, null, 2));
    return result;
  }

  // ── Trigger Discord's native Reply ───────────────────────────────────────
  //
  // The Reply button is typically the second-to-last icon in the toolbar
  // (before "More"/"..."). We find it positionally among siblings that
  // contain SVGs, which is locale-agnostic.

  async function triggerDiscordReply(buttonElement) {
    console.log(LOG, 'Triggering Discord native Reply...');

    const container = buttonElement.parentElement;
    if (!container) return false;

    // Collect all sibling elements (excluding our own button) that contain SVGs
    const iconButtons = Array.from(container.children).filter(child =>
      !child.hasAttribute('data-atomix-btn') && child.querySelector('svg')
    );

    console.log(LOG, 'Icon buttons in toolbar:', iconButtons.length,
      iconButtons.map(b => b.getAttribute('aria-label') || '?'));

    // The Reply button is usually the second-to-last (before "More/...")
    // In a typical toolbar: [Add Reaction] [Reply] [Thread] [More]
    // or: [Add Reaction] [Reply] [More]
    // Find it by trying a few positions

    let replyBtn = null;

    // First try: any button with a reply-ish aria-label (in any language)
    for (const btn of iconButtons) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      // Common translations: Reply, Відповісти, Antworten, Répondre, Responder, Ответить
      if (/reply|відповіс|antwort|répond|respond|ответ/i.test(label)) {
        replyBtn = btn;
        break;
      }
    }

    // Second try: positional — the second icon button (index 1) is very
    // often Reply in Discord's standard toolbar layout
    if (!replyBtn && iconButtons.length >= 2) {
      replyBtn = iconButtons[1];
      console.log(LOG, 'Using positional fallback (index 1) for Reply');
    }

    if (replyBtn) {
      replyBtn.click();
      console.log(LOG, 'Reply triggered:', replyBtn.getAttribute('aria-label') || '(no label)');
      await sleep(400);
      return true;
    }

    console.warn(LOG, 'Could not find Reply button');
    return false;
  }

  // ── Generate reply via background.js ─────────────────────────────────────

  async function generateReply(messageData) {
    if (!settings.extToken || !settings.userId) {
      throw new Error('Please connect your account in extension settings');
    }

    if (isRateLimited()) {
      throw new Error('Too many requests. Please wait a moment.');
    }

    recordRequest();

    console.log(LOG, 'Sending generation request to background...', {
      textLength: messageData.text?.length,
      author: messageData.author,
      language: settings.language,
      length: settings.length,
      promptId: settings.selectedPromptId,
    });

    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'GENERATE_REPLY',
          payload: {
            tweetData: messageData, // reuses existing API shape
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

    console.log(LOG, 'Generation received, length:', result.reply?.length);
    return result.reply;
  }

  // ── Slate.js typewriter injection ────────────────────────────────────────

  async function injectTextWithTypewriter(text) {
    console.log(LOG, 'Starting typewriter injection, length:', text.length);

    const editor = document.querySelector('[role="textbox"][data-slate-editor="true"]')
      || document.querySelector('[role="textbox"][contenteditable="true"]');

    if (!editor) {
      console.error(LOG, 'Slate.js editor not found');
      return false;
    }

    try {
      editor.focus();
      await sleep(150);

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      await sleep(50);

      // Method 1: execCommand char-by-char
      let method1Works = true;

      for (let i = 0; i < text.length; i++) {
        const ok = document.execCommand('insertText', false, text[i]);

        if (!ok && i === 0) {
          console.warn(LOG, 'execCommand not supported, falling back...');
          method1Works = false;
          break;
        }

        const delay = Math.floor(Math.random() * 25) + 15;
        await sleep(delay);
      }

      if (method1Works && editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Typewriter injection complete via execCommand');
        fireInputEvents(editor);
        return true;
      }

      // Method 2: InputEvent char-by-char
      console.log(LOG, 'Trying InputEvent char-by-char...');
      editor.focus();
      await sleep(100);
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      for (let i = 0; i < text.length; i++) {
        editor.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true, cancelable: true, inputType: 'insertText', data: text[i],
        }));
        editor.dispatchEvent(new InputEvent('input', {
          bubbles: true, inputType: 'insertText', data: text[i],
        }));
        const delay = Math.floor(Math.random() * 25) + 15;
        await sleep(delay);
      }

      if (editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Typewriter complete via InputEvent');
        return true;
      }

      // Method 3: ClipboardEvent paste
      console.log(LOG, 'Trying ClipboardEvent paste...');
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      editor.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true, cancelable: true, clipboardData: dt,
      }));
      await sleep(150);

      if (editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Text injected via ClipboardEvent');
        fireInputEvents(editor);
        return true;
      }

      // Method 4: clipboard
      console.warn(LOG, 'All injection methods failed, copying to clipboard');
      await navigator.clipboard.writeText(text);
      return false;

    } catch (error) {
      console.error(LOG, 'Injection error:', error);
      try { await navigator.clipboard.writeText(text); } catch (_) { }
      return false;
    }
  }

  function fireInputEvents(editor) {
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Button click handler ─────────────────────────────────────────────────

  async function handleAtomixClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isGenerating) return;

    const btn = event.currentTarget;
    console.log(LOG, 'AtomiX button clicked');

    const messageData = extractMessageData(btn);

    if (!messageData || !messageData.text) {
      showNotification('Could not read message text', 'error');
      console.warn(LOG, 'Extraction failed — no text found');
      return;
    }

    await loadSettings();
    await triggerDiscordReply(btn);

    isGenerating = true;
    const originalContent = btn.innerHTML;
    btn.innerHTML = `${createSpinner()}<span class="atomix-label">Generating...</span>`;
    btn.classList.add('atomix-loading');

    try {
      const reply = await generateReply(messageData);

      if (reply) {
        btn.innerHTML = `${createSpinner()}<span class="atomix-label">Typing...</span>`;
        console.log(LOG, 'Starting text injection...');

        const injected = await injectTextWithTypewriter(reply);

        if (injected) {
          showNotification('Reply generated!', 'success');
          console.log(LOG, 'Reply workflow complete');
        } else {
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
      btn.classList.remove('atomix-loading');
    }
  }

  // ── Button injection ─────────────────────────────────────────────────────

  function tryInjectButtons() {
    const toolbars = findHoverToolbars();

    for (const { el: toolbar, source } of toolbars) {
      // Dedup
      if (toolbar.querySelector('[data-atomix-btn]')) continue;

      // Skip context/dropdown menus
      if (toolbar.querySelector('[role="menuitem"]')) continue;

      // Log for diagnostics
      dumpToolbarInfo(toolbar, source);

      const btn = createAtomixButton();
      btn.addEventListener('click', handleAtomixClick);

      // Insert as the first child
      toolbar.insertBefore(btn, toolbar.firstChild);

      console.log(LOG, 'Button injected via', source);
    }
  }

  // ── MutationObserver ─────────────────────────────────────────────────────

  function init() {
    console.log(LOG, 'Initializing Discord content script...');

    loadSettings();
    tryInjectButtons();

    const observer = new MutationObserver((mutations) => {
      let hasNew = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          for (const n of m.addedNodes) {
            if (n.nodeType === Node.ELEMENT_NODE) { hasNew = true; break; }
          }
        }
        if (hasNew) break;
      }

      if (hasNew) {
        clearTimeout(window._atomixInjectTimeout);
        window._atomixInjectTimeout = setTimeout(tryInjectButtons, 120);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log(LOG, 'MutationObserver active — structural heuristic discovery');
    console.log(LOG, 'Extension loaded ✅');
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
