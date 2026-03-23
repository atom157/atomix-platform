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

  // ── Toolbar discovery + injection ──────────────────────────────────────────
  //
  // Discord's hover toolbar is EPHEMERAL — it appears on hover and vanishes
  // when the mouse moves. A debounced querySelectorAll sweep often misses it.
  //
  // Approach: The MutationObserver inspects each added node IMMEDIATELY.
  // We check if the node (or any descendant) is a toolbar candidate:
  //   - div[role="group"] with ≥3 children
  //   - NOT inside role="menu" or role="menuitem"
  //   - Has multiple children with aria-label attributes (icon buttons)
  //
  // VERIFIED classes (2026-03-23):
  //   Toolbar: "buttons__5126c container__040f0" — but class names change,
  //   so we rely on role="group" + structural shape instead.

  function isToolbarCandidate(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.tagName !== 'DIV') return false;
    if (el.getAttribute('role') !== 'group') return false;
    if (el.children.length < 3) return false;

    // STRICT: never inject inside menus
    if (el.closest('[role="menu"]')) return false;
    if (el.closest('[role="menuitem"]')) return false;

    // Must have children with aria-labels (action buttons have them)
    let labeledCount = 0;
    for (const kid of el.children) {
      if (kid.getAttribute('aria-label')) labeledCount++;
    }
    if (labeledCount < 2) return false;

    // Already have our button?
    if (el.querySelector('[data-atomix-btn]')) return false;

    return true;
  }

  function injectIntoToolbar(toolbar) {
    // Double-check dedup
    if (toolbar.querySelector('[data-atomix-btn]')) return;

    const btn = createAtomixButton();
    btn.addEventListener('click', handleAtomixClick);
    toolbar.insertBefore(btn, toolbar.firstChild);

    console.log(LOG, '✅ Button injected!',
      'class=' + (toolbar.className || '').substring(0, 80),
      'aria-label=' + (toolbar.getAttribute('aria-label') || '?'),
      'children=' + toolbar.children.length);
  }

  // Process a single DOM node: check itself and all descendant divs
  function processAddedNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    // Check the node itself
    if (isToolbarCandidate(node)) {
      injectIntoToolbar(node);
      return;
    }

    // Check descendants (toolbar might be nested inside the added node)
    if (node.querySelectorAll) {
      const candidates = node.querySelectorAll('div[role="group"]');
      for (const el of candidates) {
        if (isToolbarCandidate(el)) {
          injectIntoToolbar(el);
        }
      }
    }
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
  // Finds the Reply button in the same toolbar as our AtomiX button.
  // Uses multi-language aria-label matching, with positional fallback.

  async function triggerDiscordReply(buttonElement) {
    console.log(LOG, 'Triggering Discord native Reply...');

    const container = buttonElement.parentElement;
    if (!container) return false;

    // All native icon buttons in the toolbar
    const iconButtons = Array.from(container.children).filter(child =>
      !child.hasAttribute('data-atomix-btn') && child.querySelector('svg')
    );

    console.log(LOG, 'Toolbar buttons:', iconButtons.map(b =>
      b.getAttribute('aria-label') || '(no label)'
    ));

    let replyBtn = null;

    // Try 1: multi-language aria-label match
    // UA: "Відповісти", EN: "Reply", DE: "Antworten", FR: "Répondre",
    // ES: "Responder", RU: "Ответить", PL: "Odpowiedz"
    for (const btn of iconButtons) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (/reply|відповіс|antwort|répond|respond|ответ|odpowied/i.test(label)) {
        replyBtn = btn;
        break;
      }
    }

    // Try 2: positional fallback — Reply is typically the second-to-last
    if (!replyBtn && iconButtons.length >= 3) {
      replyBtn = iconButtons[iconButtons.length - 2];
      console.log(LOG, 'Positional fallback: second-to-last button');
    }

    if (replyBtn) {
      replyBtn.click();
      console.log(LOG, 'Reply triggered:', replyBtn.getAttribute('aria-label') || '(no label)');
      await sleep(400);
      return true;
    }

    console.warn(LOG, 'Reply button not found in toolbar');
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

  // ── Button injection (sweep for already-visible toolbars) ─────────────────

  function tryInjectButtons() {
    document.querySelectorAll('div[role="group"]').forEach(el => {
      if (isToolbarCandidate(el)) {
        injectIntoToolbar(el);
      }
    });
  }

  // ── MutationObserver (direct node inspection) ─────────────────────────────

  function init() {
    console.log(LOG, 'Initializing Discord content script...');

    loadSettings();

    // Initial sweep
    tryInjectButtons();

    // Watch for new nodes — process IMMEDIATELY (no debounce)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          processAddedNode(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log(LOG, 'MutationObserver active — direct node inspection mode');
    console.log(LOG, 'Extension loaded ✅');
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
