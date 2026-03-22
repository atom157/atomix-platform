// AtomiX — Discord Content Script
// Injects an "AtomiX" button into Discord's message hover toolbar,
// extracts message context, triggers native Reply, generates an AI reply
// via background.js, and injects the result into Discord's Slate.js editor.

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

    const syncResult = await chrome.storage.sync.get([
      'language', 'length', 'bannedWords', 'includeHashtags',
      'mentionAuthor', 'addEmoji', 'selectedPromptId', 'customPromptContent'
    ]);

    const secureResult = await secureStorage.get(['extToken', 'userId']);

    console.log(LOG, 'Token loaded:', {
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

  // ── Message extraction ───────────────────────────────────────────────────

  function extractMessageData(buttonElement) {
    console.log(LOG, 'Extracting message context...');

    // Walk up from the button to find the message list item.
    // Discord wraps each message in an <li> with id starting "chat-messages-".
    let messageItem = buttonElement.closest('[id^="chat-messages-"]');

    // Fallback: walk up to any list item inside the chat
    if (!messageItem) {
      messageItem = buttonElement.closest('li[class]');
    }

    // Broader fallback: look for the message container near the button
    if (!messageItem) {
      // The hover toolbar is rendered as a sibling/overlay to the message.
      // Try to find the message container relative to the toolbar's parent.
      const toolbar = buttonElement.closest('[id^="message-actions-"]')
        || buttonElement.closest('[role="group"]');
      if (toolbar) {
        // The toolbar's parent or nearest <li> ancestor
        messageItem = toolbar.closest('li') || toolbar.parentElement;
      }
    }

    if (!messageItem) {
      console.warn(LOG, 'Could not find message container');
      return null;
    }

    // Extract message text
    // Discord message content lives in elements with id "message-content-{id}"
    const contentEl = messageItem.querySelector('[id^="message-content-"]');
    let messageText = '';

    if (contentEl) {
      messageText = contentEl.innerText.trim();
    } else {
      // Fallback: look for any text content divs within the message
      const textDivs = messageItem.querySelectorAll('[class*="messageContent_"], [class*="markup_"]');
      for (const div of textDivs) {
        const text = div.innerText.trim();
        if (text) {
          messageText = text;
          break;
        }
      }
    }

    // If still nothing, try to get any substantial text from the message item
    if (!messageText) {
      // Grab all text, filter out timestamps and usernames
      const allText = messageItem.innerText;
      const lines = allText.split('\n').filter(line => line.trim().length > 2);
      // Usually the message text is the longest line or after the username
      if (lines.length > 0) {
        messageText = lines[lines.length - 1].trim();
      }
    }

    // Extract author name from the message header
    let authorName = '';
    const headerEl = messageItem.querySelector('[id^="message-username-"]')
      || messageItem.querySelector('[class*="username_"]')
      || messageItem.querySelector('h3 span, h2 span');

    if (headerEl) {
      authorName = headerEl.innerText.trim();
    }

    // If this is a "grouped" message (no header), look at the previous sibling
    if (!authorName && messageItem.previousElementSibling) {
      const prevHeader = messageItem.previousElementSibling.querySelector(
        '[id^="message-username-"]'
      );
      if (prevHeader) {
        authorName = prevHeader.innerText.trim();
      }
    }

    const result = {
      text: messageText,
      author: authorName,
      handle: '', // Discord doesn't expose handles in the message DOM easily
      metrics: {},
      threadContext: []
    };

    console.log(LOG, 'Context extracted:', JSON.stringify(result, null, 2));
    return result;
  }

  // ── Trigger Discord's native Reply ───────────────────────────────────────

  async function triggerDiscordReply(buttonElement) {
    console.log(LOG, 'Triggering Discord native Reply...');

    // Find the hover toolbar container
    const toolbar = buttonElement.closest('[id^="message-actions-"]')
      || buttonElement.closest('[role="group"]')
      || buttonElement.parentElement;

    if (!toolbar) {
      console.warn(LOG, 'Could not find toolbar for Reply trigger');
      return false;
    }

    // Look for Discord's native Reply button
    // It typically has aria-label="Reply" or a tooltip "Reply"
    let replyBtn = toolbar.querySelector('[aria-label="Reply"]');

    // Fallback: look for button with a reply icon (the SVG path for reply arrow)
    if (!replyBtn) {
      const buttons = toolbar.querySelectorAll('div[role="button"], button');
      for (const b of buttons) {
        const label = b.getAttribute('aria-label') || b.textContent || '';
        if (label.toLowerCase().includes('reply')) {
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

    console.log(LOG, 'Sending generation request to background...');

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

  // ── Slate.js text injection ──────────────────────────────────────────────
  //
  // Discord uses Slate.js for its text editor. Like Draft.js, it maintains
  // internal state that must be synced. Strategy:
  //   1. Try execCommand('insertText') — same single-shot that works for Draft.js
  //   2. Fallback: synthetic ClipboardEvent('paste') with DataTransfer
  //   3. Last resort: copy to clipboard + notify user

  async function injectTextIntoSlate(text) {
    console.log(LOG, 'Injecting text into Slate.js editor...');

    // Find the Slate.js editor
    const editor = document.querySelector('[role="textbox"][data-slate-editor="true"]')
      || document.querySelector('[role="textbox"][contenteditable="true"]');

    if (!editor) {
      console.error(LOG, 'Slate.js editor not found');
      return false;
    }

    try {
      // Focus the editor
      editor.focus();
      await sleep(100);

      // Select any existing content (e.g., @mention from reply) and move cursor to end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // collapse to end
      selection.removeAllRanges();
      selection.addRange(range);
      await sleep(50);

      // ── Method 1: execCommand insertText ──
      const inserted = document.execCommand('insertText', false, text);

      if (inserted && editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Text injected successfully via execCommand');
        fireInputEvents(editor);
        return true;
      }

      console.log(LOG, 'execCommand failed, trying ClipboardEvent fallback...');

      // ── Method 2: Synthetic paste event with DataTransfer ──
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      });

      editor.dispatchEvent(pasteEvent);
      await sleep(100);

      if (editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Text injected successfully via ClipboardEvent');
        fireInputEvents(editor);
        return true;
      }

      console.log(LOG, 'ClipboardEvent failed, trying InputEvent fallback...');

      // ── Method 3: InputEvent with insertText ──
      const inputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      });
      editor.dispatchEvent(inputEvent);
      await sleep(100);

      if (editor.textContent.includes(text.substring(0, 20))) {
        console.log(LOG, 'Text injected successfully via InputEvent');
        fireInputEvents(editor);
        return true;
      }

      // ── Last resort: clipboard ──
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
    // Fire events to ensure Slate.js picks up the change
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

    // Extract message context
    const messageData = extractMessageData(btn);

    if (!messageData || !messageData.text) {
      showNotification('Could not read message text', 'error');
      return;
    }

    // Trigger Discord's native reply
    await triggerDiscordReply(btn);

    isGenerating = true;
    const originalContent = btn.innerHTML;
    btn.innerHTML = `${createSpinner()}<span class="atomix-label">Generating...</span>`;
    btn.classList.add('atomix-loading');

    try {
      await loadSettings();
      const reply = await generateReply(messageData);

      if (reply) {
        btn.innerHTML = `${createSpinner()}<span class="atomix-label">Typing...</span>`;

        const injected = await injectTextIntoSlate(reply);

        if (injected) {
          showNotification('Reply generated!', 'success');
          console.log(LOG, 'Reply workflow complete — text injected');
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

  // ── Button injection ─────────────────────────────────────────────────────

  function tryInjectButtons() {
    // Discord's message hover toolbar appears when hovering a message.
    // It uses id="message-actions-{id}" containers with button groups inside.

    // Strategy 1: Look for message action containers by ID prefix
    const actionContainers = document.querySelectorAll('[id^="message-actions-"]');

    actionContainers.forEach(container => {
      if (container.querySelector('[data-atomix-btn]')) return; // already injected

      // Find the buttons group inside (usually a div with role="group" or flex container)
      let buttonsGroup = container.querySelector('[role="group"]')
        || container.querySelector('[class*="buttons_"]');

      // If no inner group, use the container itself
      if (!buttonsGroup) {
        buttonsGroup = container;
      }

      const btn = createAtomixButton();
      btn.addEventListener('click', handleAtomixClick);

      // Insert as the first button in the toolbar
      buttonsGroup.insertBefore(btn, buttonsGroup.firstChild);

      console.log(LOG, 'Button injected into message actions toolbar');
    });

    // Strategy 2: Look for role="group" with aria-label containing "actions"
    const roleGroups = document.querySelectorAll('[role="group"][aria-label]');

    roleGroups.forEach(group => {
      const label = (group.getAttribute('aria-label') || '').toLowerCase();
      if (!label.includes('action') && !label.includes('message')) return;
      if (group.querySelector('[data-atomix-btn]')) return; // already injected

      const btn = createAtomixButton();
      btn.addEventListener('click', handleAtomixClick);
      group.insertBefore(btn, group.firstChild);

      console.log(LOG, 'Button injected via role="group" fallback');
    });
  }

  // ── MutationObserver ─────────────────────────────────────────────────────

  function init() {
    console.log(LOG, 'Initializing Discord content script...');

    loadSettings();

    // Initial injection attempt
    tryInjectButtons();

    // Observe DOM for dynamically appearing hover toolbars
    const observer = new MutationObserver((mutations) => {
      let shouldInject = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            // Check if the added node is or contains a message actions toolbar
            if (
              (node.id && node.id.startsWith('message-actions-')) ||
              node.querySelector?.('[id^="message-actions-"]') ||
              node.querySelector?.('[role="group"][aria-label]')
            ) {
              shouldInject = true;
              break;
            }
          }
          if (shouldInject) break;
        }
      }

      if (shouldInject) {
        // Debounce to avoid excessive DOM queries
        clearTimeout(window._atomixInjectTimeout);
        window._atomixInjectTimeout = setTimeout(tryInjectButtons, 150);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log(LOG, 'MutationObserver active — watching for hover toolbars');
    console.log(LOG, 'Extension loaded ✅');
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
