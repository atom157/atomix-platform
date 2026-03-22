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

  // ── Message extraction (ID-based) ────────────────────────────────────────
  //
  // FIX: Instead of vague DOM walking, extract the message ID directly from
  // the toolbar's own id ("message-actions-{messageId}") and use it to
  // precisely locate the content and username elements by their stable IDs.

  function extractMessageData(buttonElement) {
    console.log(LOG, 'Extracting message context...');

    // Step 1: Find the hover toolbar and extract the message snowflake ID
    const toolbar = buttonElement.closest('[id^="message-actions-"]');
    if (!toolbar) {
      console.warn(LOG, 'Could not find message-actions toolbar');
      return null;
    }

    const messageId = toolbar.id.replace('message-actions-', '');
    console.log(LOG, 'Target message ID:', messageId);

    // Step 2: Find message content by its stable ID
    let messageText = '';
    const contentEl = document.getElementById(`message-content-${messageId}`);
    if (contentEl) {
      messageText = contentEl.innerText.trim();
      console.log(LOG, 'Text found via message-content-' + messageId);
    }

    // Fallback: walk up to the parent <li> and search within it
    if (!messageText) {
      const listItem = toolbar.closest('[id^="chat-messages-"]') || toolbar.closest('li');
      if (listItem) {
        const fallback = listItem.querySelector('[id^="message-content-"]');
        if (fallback) {
          messageText = fallback.innerText.trim();
          console.log(LOG, 'Text found via li fallback');
        }
      }
    }

    // Last-resort fallback: grab the longest text block from the message area
    if (!messageText) {
      const listItem = toolbar.closest('[id^="chat-messages-"]') || toolbar.closest('li');
      if (listItem) {
        const lines = listItem.innerText.split('\n').filter(l => l.trim().length > 3);
        if (lines.length > 0) {
          // Pick the longest line (most likely the actual message content)
          messageText = lines.reduce((a, b) => a.length >= b.length ? a : b).trim();
          console.log(LOG, 'Text found via innerText heuristic');
        }
      }
    }

    // Step 3: Find author name by stable ID
    let authorName = '';
    const usernameEl = document.getElementById(`message-username-${messageId}`);
    if (usernameEl) {
      authorName = usernameEl.innerText.trim();
    }

    // Fallback for grouped messages (consecutive messages from same author
    // don't repeat the header — look at previous siblings)
    if (!authorName) {
      const listItem = toolbar.closest('[id^="chat-messages-"]') || toolbar.closest('li');
      if (listItem) {
        // Check this item first
        const localHeader = listItem.querySelector('[id^="message-username-"]');
        if (localHeader) {
          authorName = localHeader.innerText.trim();
        } else {
          // Walk backwards through siblings to find the nearest header
          let sibling = listItem.previousElementSibling;
          let attempts = 0;
          while (sibling && attempts < 10) {
            const prevHeader = sibling.querySelector('[id^="message-username-"]');
            if (prevHeader) {
              authorName = prevHeader.innerText.trim();
              break;
            }
            sibling = sibling.previousElementSibling;
            attempts++;
          }
        }
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

  async function triggerDiscordReply(buttonElement) {
    console.log(LOG, 'Triggering Discord native Reply...');

    const toolbar = buttonElement.closest('[id^="message-actions-"]');
    if (!toolbar) {
      console.warn(LOG, 'Could not find toolbar for Reply trigger');
      return false;
    }

    // Look for the Reply button by aria-label
    let replyBtn = toolbar.querySelector('[aria-label="Reply"]');

    // Fallback: scan all clickable elements in the toolbar
    if (!replyBtn) {
      const buttons = toolbar.querySelectorAll('[role="button"], button');
      for (const b of buttons) {
        const label = (b.getAttribute('aria-label') || '').toLowerCase();
        if (label.includes('reply')) {
          replyBtn = b;
          break;
        }
      }
    }

    if (replyBtn) {
      replyBtn.click();
      console.log(LOG, 'Reply button clicked — waiting for reply UI...');
      await sleep(400);
      return true;
    }

    console.warn(LOG, 'Native Reply button not found in toolbar');
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
  //
  // FIX: Character-by-character insertion using execCommand('insertText')
  // per character with randomised delays for a natural typewriter feel.
  // Slate.js (unlike Draft.js) tolerates incremental execCommand calls
  // because it hooks into the browser-native beforeinput event per keystroke.
  //
  // Fallback chain:
  //   1. execCommand char-by-char  (typewriter + Slate state sync)
  //   2. InputEvent('beforeinput') char-by-char
  //   3. ClipboardEvent single-shot paste
  //   4. Clipboard copy + user notification

  async function injectTextWithTypewriter(text) {
    console.log(LOG, 'Starting typewriter injection, length:', text.length);

    const editor = document.querySelector('[role="textbox"][data-slate-editor="true"]')
      || document.querySelector('[role="textbox"][contenteditable="true"]');

    if (!editor) {
      console.error(LOG, 'Slate.js editor not found');
      return false;
    }

    try {
      // Focus and place cursor at end of any existing content
      editor.focus();
      await sleep(150);

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // collapse to end
      selection.removeAllRanges();
      selection.addRange(range);
      await sleep(50);

      // ── Method 1: execCommand char-by-char (primary typewriter) ──
      let method1Works = true;

      for (let i = 0; i < text.length; i++) {
        const ok = document.execCommand('insertText', false, text[i]);

        if (!ok && i === 0) {
          console.warn(LOG, 'execCommand not supported, falling back...');
          method1Works = false;
          break;
        }

        // Natural typing delay: 15-40ms randomised
        const delay = Math.floor(Math.random() * 25) + 15;
        await sleep(delay);
      }

      if (method1Works && editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Typewriter injection complete via execCommand');
        fireInputEvents(editor);
        return true;
      }

      console.log(LOG, 'execCommand typewriter failed, trying InputEvent char-by-char...');

      // ── Method 2: InputEvent('beforeinput') char-by-char ──
      // Re-focus and position cursor
      editor.focus();
      await sleep(100);
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      for (let i = 0; i < text.length; i++) {
        const inputEv = new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text[i],
        });
        editor.dispatchEvent(inputEv);

        // Also fire the 'input' event that Slate expects after each keystroke
        editor.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          inputType: 'insertText',
          data: text[i],
        }));

        const delay = Math.floor(Math.random() * 25) + 15;
        await sleep(delay);
      }

      if (editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Typewriter injection complete via InputEvent');
        return true;
      }

      console.log(LOG, 'InputEvent typewriter failed, trying ClipboardEvent paste...');

      // ── Method 3: Synthetic clipboard paste (single-shot, no typewriter) ──
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer,
      });
      editor.dispatchEvent(pasteEvent);
      await sleep(150);

      if (editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Text injected via ClipboardEvent paste');
        fireInputEvents(editor);
        return true;
      }

      // ── Method 4: Clipboard copy — user pastes manually ──
      console.warn(LOG, 'All injection methods failed, copying to clipboard');
      await navigator.clipboard.writeText(text);
      return false;

    } catch (error) {
      console.error(LOG, 'Text injection error:', error);
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

    // Step 1: Extract message context BEFORE the toolbar disappears
    const messageData = extractMessageData(btn);

    if (!messageData || !messageData.text) {
      showNotification('Could not read message text', 'error');
      console.warn(LOG, 'Extraction failed — no text found');
      return;
    }

    // Step 2: Load settings fresh (ensures latest prompt/language/length)
    await loadSettings();

    // Step 3: Trigger Discord's native reply
    await triggerDiscordReply(btn);

    // Step 4: Generate and inject
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
          console.log(LOG, 'Reply workflow complete — text injected successfully');
        } else {
          showNotification('Copied to clipboard! Press Ctrl+V', 'success');
          console.log(LOG, 'Reply copied to clipboard as fallback');
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

  // ── Button injection (FIXED — hover toolbar only) ────────────────────────
  //
  // FIX: ONLY target the primary message hover toolbar identified by its
  // stable id="message-actions-{snowflake}". Removed Strategy 2 which used
  // [role="group"][aria-label] — that selector was catching Discord's "..."
  // context menu items and causing duplicate button injection.

  function tryInjectButtons() {
    const toolbars = document.querySelectorAll('[id^="message-actions-"]');

    toolbars.forEach(toolbar => {
      // Skip if this toolbar already has our button
      if (toolbar.querySelector('[data-atomix-btn]')) return;

      // Verify this is a hover toolbar and NOT a context/popover menu.
      // Hover toolbars are positioned absolutely over messages as small bars.
      // Context menus are in a portal layer (inside [class*="layerContainer"])
      if (toolbar.closest('[class*="layerContainer"]') || toolbar.closest('[role="dialog"]')) {
        return; // This is inside a popover/modal — skip
      }

      // Find the direct button wrapper (first child div) or use toolbar itself
      const wrapper = toolbar.firstElementChild || toolbar;

      const btn = createAtomixButton();
      btn.addEventListener('click', handleAtomixClick);

      // Insert as the first action in the toolbar
      wrapper.insertBefore(btn, wrapper.firstChild);

      console.log(LOG, 'Button injected into hover toolbar:', toolbar.id);
    });
  }

  // ── MutationObserver (FIXED — no [role="group"] matching) ────────────────

  function init() {
    console.log(LOG, 'Initializing Discord content script...');

    loadSettings();
    tryInjectButtons();

    const observer = new MutationObserver((mutations) => {
      let shouldInject = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length === 0) continue;

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // ONLY trigger when a message-actions toolbar is added to the DOM.
          // Do NOT match [role="group"] — that catches context menus.
          if (
            (node.id && node.id.startsWith('message-actions-')) ||
            node.querySelector?.('[id^="message-actions-"]')
          ) {
            shouldInject = true;
            break;
          }
        }
        if (shouldInject) break;
      }

      if (shouldInject) {
        clearTimeout(window._atomixInjectTimeout);
        window._atomixInjectTimeout = setTimeout(tryInjectButtons, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log(LOG, 'MutationObserver active — watching for hover toolbars only');
    console.log(LOG, 'Extension loaded ✅');
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
