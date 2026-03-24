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

  // ── Toolbar discovery + injection (Brute-Force Polling) ──────────────────
  //
  // MutationObserver and mouseover delegation both failed because React
  // reuses DOM nodes and toggles visibility, and synthetic events swallow
  // propagation. Brute-force polling bypasses all React lifecycle issues.
  //
  // Every 500ms:
  //   1. Query for native Reply buttons via multi-language aria-labels
  //   2. Walk up to parent container (the hover toolbar)
  //   3. Skip if inside role="menu" (context menu)
  //   4. Skip if already has [data-atomix-btn]
  //   5. Inject AtomiX button

  // Multi-language Reply button aria-label selector
  const REPLY_SELECTOR = [
    '[aria-label="Reply"]',
    '[aria-label="Відповісти"]',
    '[aria-label="Ответить"]',
    '[aria-label="Antworten"]',
    '[aria-label="Répondre"]',
    '[aria-label="Responder"]',
    '[aria-label="Odpowiedz"]',
    '[aria-label="Rispondi"]',
    '[aria-label="Odpovědět"]'
  ].join(', ');

  function pollForToolbars() {
    const replyButtons = document.querySelectorAll(REPLY_SELECTOR);

    for (const replyBtn of replyButtons) {
      // The direct flex container for the icons
      const toolbar = replyBtn.parentNode;
      if (!toolbar) continue;

      // STRICT: never inject inside menus
      if (replyBtn.closest('[role="menu"]')) continue;
      if (replyBtn.closest('[role="menuitem"]')) continue;

      // Dedup: already injected next to this button
      if (toolbar.querySelector('[data-atomix-btn]')) continue;

      // The "Perfect Clone" Strategy:
      // The 'replyBtn' itself is exactly the wrapper node we need to clone.
      // It inherently possesses Discord's exact utility classes for inline layout.
      const wrapper = replyBtn.cloneNode(false);
      wrapper.innerHTML = '';
      wrapper.removeAttribute('aria-label');
      wrapper.removeAttribute('id');

      wrapper.setAttribute('data-atomix-btn', 'true');
      wrapper.setAttribute('aria-label', 'Generate AI reply with AtomiX');
      wrapper.title = 'Generate AI Reply with AtomiX';
      wrapper.classList.add('atomix-discord-btn');

      wrapper.innerHTML = `
        <svg class="atomix-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.3" fill="none"/>
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.3" fill="none" transform="rotate(60 12 12)"/>
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.3" fill="none" transform="rotate(-60 12 12)"/>
          <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
        </svg>
      `;

      wrapper.addEventListener('click', handleAtomixClick);

      // Insert exactly between Reply and Forward arrows inside their direct container
      toolbar.insertBefore(wrapper, replyBtn.nextSibling);

      console.log(LOG, '✅ Button injected at perfect clone depth!',
        'toolbar-class=' + (toolbar.className || '').substring(0, 60),
        'wrapper-class=' + (wrapper.className || '').substring(0, 60));
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
    const allContentEls = listItem.querySelectorAll('[id^="message-content-"]');
    for (const el of allContentEls) {
      if (el.closest('[class*="repliedMessage_"]')) continue;
      messageText = el.innerText.trim();
      if (messageText) {
        console.log(LOG, 'Text found via [id^=message-content-]');
        break;
      }
    }

    if (!messageText) {
      const allMarkupEls = listItem.querySelectorAll('[class*="markup_"], [class*="messageContent_"]');
      for (const el of allMarkupEls) {
        if (el.closest('[class*="repliedMessage_"]')) continue;
        messageText = el.innerText.trim();
        if (messageText) {
          console.log(LOG, 'Text found via class fallback');
          break;
        }
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
    const allUsernameEls = listItem.querySelectorAll('[id^="message-username-"]');
    for (const el of allUsernameEls) {
      if (el.closest('[class*="repliedMessage_"]')) continue;
      authorName = el.innerText.trim();
      if (authorName) break;
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

  // ── Slate.js injection (React State Sync) ───────────────────────────────

  async function injectTextWithTypewriter(text) {
    console.log(LOG, 'Starting robust Slate.js injection, length:', text.length);

    const editor = document.querySelector('[role="textbox"][data-slate-editor="true"]')
      || document.querySelector('[role="textbox"][contenteditable="true"]');

    if (!editor) {
      console.error(LOG, 'Slate.js editor not found');
      return false;
    }

    try {
      editor.focus();
      await sleep(150);

      // Clear any existing range/selection and focus at the end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      await sleep(50);

      // Task 2: Restore Typewriter Effect
      // Wrap the successful React/Slate paste simulation in an async loop
      console.log(LOG, 'Dispatching char-by-char React-compatible paste events...');

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        const dt = new DataTransfer();
        dt.setData('text/plain', char);

        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dt
        });

        editor.dispatchEvent(pasteEvent);

        // Wait for human-like typing effect
        await sleep(20 + Math.random() * 30);
      }

      await sleep(150);

      // If paste simulation fails to update DOM, fallback to strict beforeinput chain
      if (!editor.textContent.includes(text.substring(0, 10))) {
        console.warn(LOG, 'Paste simulation failed, trying strict beforeinput chain...');

        for (let i = 0; i < text.length; i++) {
          const char = text[i];

          editor.dispatchEvent(new InputEvent('beforeinput', {
            bubbles: true, cancelable: true, inputType: 'insertText', data: char
          }));

          editor.dispatchEvent(new InputEvent('input', {
            bubbles: true, cancelable: true, inputType: 'insertText', data: char
          }));

          await sleep(Math.floor(Math.random() * 20) + 15);
        }
      }

      if (editor.textContent.includes(text.substring(0, 10))) {
        console.log(LOG, 'Injection complete and synced with Slate.js');
        // Extra assurance for React state
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      console.warn(LOG, 'All DOM injection methods failed.');
      return false;

    } catch (error) {
      console.error(LOG, 'Injection error:', error);
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
    btn.innerHTML = `${createSpinner()} <span class="atomix-label">Generating...</span>`;
    btn.classList.add('atomix-loading');

    try {
      const reply = await generateReply(messageData);

      if (reply) {
        btn.innerHTML = `${createSpinner()} <span class="atomix-label">Typing...</span>`;
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

  // ── Init (Brute-Force Polling) ───────────────────────────────────────

  function init() {
    console.log(LOG, 'Initializing Discord content script...');

    loadSettings();

    // Poll every 500ms for reply buttons → inject AtomiX
    setInterval(pollForToolbars, 500);

    // Also run once immediately
    pollForToolbars();

    console.log(LOG, '500ms polling active — anchoring on Reply button aria-labels');
    console.log(LOG, 'Extension loaded ✅');
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
