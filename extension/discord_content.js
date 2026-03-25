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
      // Find the MAIN horizontal flex container that holds ALL icons
      const toolbar = replyBtn.closest('[role="group"]') || replyBtn.closest('[class*="buttons_"]');
      if (!toolbar) continue;

      // STRICT: never inject inside menus
      if (toolbar.closest('[role="menu"]')) continue;
      if (toolbar.closest('[role="menuitem"]')) continue;
      if (replyBtn.closest('[role="menu"]')) continue;
      if (replyBtn.closest('[role="menuitem"]')) continue;

      // Dedup: already injected next to this button
      if (toolbar.querySelector('[data-atomix-btn]')) continue;

      // The "Precise Single-Node Cloning" Strategy
      let targetNode = replyBtn;

      // Check if the parent is a dedicated single-button wrapper
      if (replyBtn.parentElement && replyBtn.parentElement.children.length === 1) {
        targetNode = replyBtn.parentElement;
      }

      // Clone the exact, single flex node (preserving deep visual classes)
      const clonedBlock = targetNode.cloneNode(true);
      clonedBlock.removeAttribute('id');
      clonedBlock.setAttribute('data-atomix-btn', 'true');

      // Update tooltip labels anywhere inside the cloned hierarchy
      const tooltipElements = clonedBlock.querySelectorAll('[aria-label], [title]');
      for (const el of tooltipElements) {
        if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'AtomiX Reply');
        if (el.hasAttribute('title')) el.setAttribute('title', 'AtomiX Reply');
      }
      if (clonedBlock.hasAttribute('aria-label')) clonedBlock.setAttribute('aria-label', 'AtomiX Reply');

      clonedBlock.classList.add('atomix-discord-btn');

      // Find the deeply nested native SVG and surgically swap it
      const nativeSvg = clonedBlock.querySelector('svg');
      if (nativeSvg) {
        nativeSvg.outerHTML = `
        <svg class="atomix-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse class="atom-orbit orbit-1" cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.3" fill="none"/>
          <ellipse class="atom-orbit orbit-2" cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.3" fill="none"/>
          <ellipse class="atom-orbit orbit-3" cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.3" fill="none"/>
          <circle class="atom-core" cx="12" cy="12" r="2.5" fill="currentColor"/>
        </svg>
        `;
      }

      clonedBlock.addEventListener('click', handleAtomixClick);

      // Insert exactly between Reply and Forward arrows inside the container
      targetNode.parentNode.insertBefore(clonedBlock, targetNode.nextSibling);

      console.log(LOG, '✅ Button injected at Single-Node clone depth!',
        'toolbar-class=' + (toolbar.className || '').substring(0, 60),
        'block-class=' + (clonedBlock.className || '').substring(0, 60));
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

    // Phase 2: Web3 Hunter Context Matrix
    // 1. Identity (Server & Channel via document.title)
    const titleParts = document.title.split(' | ');
    const channelName = titleParts[0] || '';
    const serverName = titleParts.length > 2 ? titleParts[1] : '';

    // 2. Target Message Quoted Context
    let quotedContext = null;
    const replyBlock = listItem.querySelector('[class*="repliedMessage_"]');
    if (replyBlock) {
      let rAuthor = replyBlock.querySelector('[class*="username_"], [class*="author_"]')?.innerText?.trim() || '';
      let rText = replyBlock.querySelector('[class*="repliedTextPreview_"], [class*="messageContent_"], [class*="content_"]')?.innerText?.trim() || '';
      if (rText) {
        rAuthor = rAuthor.replace(/^@/, '');
        quotedContext = { author: rAuthor, text: rText };
        console.log(LOG, 'Extracted quoted reply context:', quotedContext);
      }
    }

    // Helper to parse sibling history nodes
    function parseMessageNode(node) {
      if (!node) return null;
      if (node.querySelector('[class*="divider_"]')) return null; // skip date dividers
      if (!node.id || !node.id.startsWith('chat-messages-')) return null;

      let text = '';
      for (const el of node.querySelectorAll('[id^="message-content-"], [class*="markup_"]')) {
        if (el.closest('[class*="repliedMessage_"]')) continue;
        text = el.innerText.trim();
        if (text) break;
      }
      if (!text) return null;

      let author = '';
      for (const el of node.querySelectorAll('[id^="message-username-"], [class*="username_"]')) {
        if (el.closest('[class*="repliedMessage_"]')) continue;
        author = el.innerText.trim();
        if (author) break;
      }

      // If continuation message, look up for author
      if (!author) {
        let p = node.previousElementSibling;
        for (let i = 0; i < 15 && p; p = p.previousElementSibling, i++) {
          const u = p.querySelector('[id^="message-username-"], [class*="username_"]');
          if (u && !u.closest('[class*="repliedMessage_"]')) { author = u.innerText.trim(); break; }
        }
      }
      return { author, text };
    }

    // 3. Conversation History (Last 3 messages)
    const threadContext = [];
    let sibling = listItem.previousElementSibling;
    let attempts = 0;
    while (sibling && threadContext.length < 3 && attempts < 15) {
      const msg = parseMessageNode(sibling);
      if (msg) threadContext.unshift(msg); // Prepend to keep chronological order
      sibling = sibling.previousElementSibling;
      attempts++;
    }

    console.log(LOG, `Extracted ${threadContext.length} history messages for context window.`);

    const result = {
      text: messageText,
      author: authorName,
      handle: '',
      metrics: {},
      threadContext: threadContext,
      quotedContext: quotedContext,
      channelName: channelName,
      serverName: serverName
    };

    console.log(LOG, 'Context Matrix extracted:', JSON.stringify(result, null, 2));
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

      // Stabilized Typewriter Effect
      // Dispatch single-character paste events with cursor stabilization between each.
      // Before each character, we strictly enforce the selection at the END of the
      // editor's content so Slate.js never loses its cursor position mid-loop.
      console.log(LOG, 'Dispatching char-by-char paste events with cursor stabilization...');

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 1. Keep Editor Focused 
        editor.focus();

        // 2. Synchronous DOM Mutation
        // Bypassing `ClipboardEvent` ("paste") entirely disables Discord's asynchronous 
        // Markdown/Emoji parsing queues, which scramble concurrent pastes over 20ms delays.
        // `insertText` directly mutates the physical DOM text string synchronously,
        // and instantly advances the browser's native cursor without React's help.
        document.execCommand('insertText', false, char);

        // 3. React Fiber Virtual DOM Sync
        // Immediately broadcast a standard 'input' event so Slate's underlying hooks 
        // fetch the newly modified DOM string and update the virtual component State.
        editor.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: char
        }));

        // 4. Typewriter Delay
        // A small delay purely for the visual effect. React easily finishes its 
        // asynchronous commit phase loop in this timeframe. 
        await sleep(30 + Math.random() * 20);
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
    btn.classList.add('atomix-loading');

    const labelSpan = btn.querySelector('.atomix-label');
    if (labelSpan) labelSpan.textContent = 'Generating...';

    try {
      const reply = await generateReply(messageData);

      if (reply) {
        if (labelSpan) labelSpan.textContent = 'Typing...';
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
      btn.classList.remove('atomix-loading');
      if (labelSpan) labelSpan.textContent = 'AtomiX';
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
