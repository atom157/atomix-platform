/* global chrome */

// DOM Elements
var languageSelect = document.getElementById('language');
var lengthSelect = document.getElementById('length');
var bannedWordsInput = document.getElementById('bannedWords');
var includeHashtagsCheckbox = document.getElementById('includeHashtags');
var mentionAuthorCheckbox = document.getElementById('mentionAuthor');
var addEmojiCheckbox = document.getElementById('addEmoji');
var saveBtn = document.getElementById('saveBtn');
var statusEl = document.getElementById('status');

// New Prompt DOM Elements
var customPromptName = document.getElementById('customPromptName');
var customPromptContent = document.getElementById('customPromptContent');
var saveCustomPromptBtn = document.getElementById('saveCustomPromptBtn');
var charCounter = document.getElementById('charCounter');

// Account elements
var connectBtn = document.getElementById('connectBtn');
var disconnectBtn = document.getElementById('disconnectBtn');
var notConnectedSection = document.getElementById('notConnected');
var connectedSection = document.getElementById('connected');
var tierBadge = document.getElementById('tierBadge');
var usageText = document.getElementById('usageText');
var usageFill = document.getElementById('usageFill');
var promptCard = document.getElementById('promptCard');
var promptSelect = document.getElementById('promptSelect');

// API base URL
var API_BASE = 'https://www.atomix.guru';
var chrome = window.chrome;

var activePlatform = 'discord'; // default platform
var syncDataCache = {}; // holds globally fetched settings to isolate platform changes

import('./posthog-api.js').then(module => {
  window.posthogTrackEvent = module.trackEvent;
});

console.log('[POPUP] Initializing...');

document.querySelectorAll('.platform-tab').forEach(btn => {
  btn.addEventListener('click', function() {
    var p = this.getAttribute('data-platform');
    if (activePlatform !== p) switchPlatform(p);
  });
});

function switchPlatform(platform) {
  activePlatform = platform;
  chrome.storage.sync.set({ activePlatform: platform });
  
  // UI styling
  document.querySelectorAll('.platform-tab').forEach(btn => {
    if (btn.getAttribute('data-platform') === platform) {
      btn.style.background = '#fff';
      btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      btn.style.color = '#0f172a';
      btn.classList.add('active');
    } else {
      btn.style.background = 'transparent';
      btn.style.boxShadow = 'none';
      btn.style.color = '#64748b';
      btn.classList.remove('active');
    }
  });

  renderPromptsDropdown();
  showSelectView();
}

// ── Optimistic Auth: instantly show cached state to prevent flicker ──
(function optimisticLoad() {
  chrome.storage.local.get(['extToken', 'userId', 'cachedPlan', 'cachedUsed', 'cachedLimit'], function (c) {
    if (c.extToken && c.userId) {
      // User was logged in last time — show connected section immediately
      notConnectedSection.style.display = 'none';
      connectedSection.style.display = 'block';
      // Restore cached tier/usage if available
      if (c.cachedPlan) {
        var plan = c.cachedPlan;
        tierBadge.className = 'tier-badge tier-' + plan;
        if (plan === 'pro') {
          tierBadge.textContent = '✨ PRO';
          tierBadge.style.background = 'linear-gradient(135deg, #8B5CF6, #D946EF)';
          tierBadge.style.color = '#fff';
          tierBadge.style.border = 'none';
          tierBadge.style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)';
          tierBadge.style.animation = 'proBadgeShimmer 2.5s ease-in-out infinite';
        } else {
          tierBadge.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
        }
      }
      if (c.cachedUsed !== undefined && c.cachedLimit) {
        usageText.textContent = c.cachedUsed + ' / ' + c.cachedLimit + ' replies';
        var pct = Math.min((c.cachedUsed / c.cachedLimit) * 100, 100);
        usageFill.style.width = pct + '%';
      }
    } else {
      // Not logged in — show connect
      notConnectedSection.style.display = 'block';
      connectedSection.style.display = 'none';
    }
  });
})();

// Use LOCAL storage (not session - for compatibility with content scripts)
function getSecureToken(callback) {
  console.log('[POPUP] getSecureToken - checking local storage');
  chrome.storage.local.get(['extToken', 'userId'], function (result) {
    console.log('[POPUP] Local storage:', { hasToken: !!result.extToken, hasUserId: !!result.userId });
    callback(result);
  });
}

function setSecureToken(token, userId, callback) {
  console.log('[POPUP] setSecureToken - saving to local storage');
  chrome.storage.local.set({ extToken: token, userId: userId }, function () {
    chrome.storage.sync.set({ userId: userId, isConnected: true }, function () {
      console.log('[POPUP] ✅ Token saved');
      if (callback) callback();
    });
  });
}

function clearSecureToken(callback) {
  console.log('[POPUP] clearSecureToken');
  chrome.storage.local.remove(['extToken', 'userId', 'cachedPlan', 'cachedUsed', 'cachedLimit'], function () {
    chrome.storage.sync.remove(['userId', 'extToken', 'selectedPromptId', 'isConnected'], function () {
      console.log('[POPUP] ✅ Token + cache cleared');
      if (callback) callback();
    });
  });
}

function loadSettings() {
  console.log('[POPUP] loadSettings');
  chrome.storage.sync.get([
    'language', 'length', 'bannedWords',
    'includeHashtags', 'mentionAuthor', 'addEmoji', 
    'selectedPromptId_discord', 'selectedPromptId_x',
    'selectedPromptId', // legacy migration
    'activePlatform'
  ], function (result) {
    syncDataCache = result;
    if (result.activePlatform) {
      switchPlatform(result.activePlatform);
    }
    
    // Migration for legacy users (Task 4)
    if (result.selectedPromptId && !result.selectedPromptId_discord) {
      syncDataCache.selectedPromptId_discord = result.selectedPromptId;
      chrome.storage.sync.set({ selectedPromptId_discord: result.selectedPromptId });
    }

    if (result.language) languageSelect.value = result.language;
    if (result.length) lengthSelect.value = result.length;
    if (result.bannedWords) bannedWordsInput.value = result.bannedWords;
    
    includeHashtagsCheckbox.checked = result.includeHashtags || false;
    mentionAuthorCheckbox.checked = result.mentionAuthor || false;
    addEmojiCheckbox.checked = result.addEmoji || false;

    checkAuthAndShowState(syncDataCache['selectedPromptId_' + activePlatform]);
  });
}

// Check auth
let authCheckInterval = null;

function checkAuthAndShowState(selectedPromptId) {
  console.log('[POPUP] checkAuthAndShowState');
  getSecureToken(function (tokenResult) {
    if (tokenResult.userId && tokenResult.extToken) {
      console.log('[POPUP] ✅ Authenticated');
      if (authCheckInterval) clearInterval(authCheckInterval);
      showConnectedState(tokenResult.userId, tokenResult.extToken, selectedPromptId);
    } else {
      console.log('[POPUP] ❌ Not authenticated');
      showDisconnectedState();

      // Token arrives via extension-auth.js DOM handshake on /auth/extension-connected.
      // The chrome.storage.onChanged listener (at the bottom of this file)
      // automatically detects when the token is stored and triggers a reload.
      console.log('[POPUP] Waiting for auth via extension-connected page...');
    }
  });
}

// Show connected state
var _retryCount = 0;

function showConnectedState(userId, extToken, selectedPromptId) {
  console.log('[POPUP] showConnectedState - fetching data from:', API_BASE + '/api/extension/prompts');

  fetch(API_BASE + '/api/extension/prompts', {
    headers: { 'Authorization': 'Bearer ' + extToken },
    credentials: 'include'
  })
    .then(function (response) {
      console.log('[POPUP] API response:', response.status, response.url);
      if (response.status === 401) {
        if (_retryCount < 1) {
          _retryCount++;
          console.log('[POPUP] ❌ Token expired. Attempting ONE re-sync via background...');
          chrome.runtime.sendMessage({ type: 'EXTRACT_TOKEN' }, function (bgResponse) {
            if (bgResponse && bgResponse.ok) {
              console.log('[POPUP] ✅ Token refreshed via background. Retrying...');
              showConnectedState(bgResponse.userId, bgResponse.token, selectedPromptId);
            } else {
              console.log('[POPUP] ❌ Background refresh also failed. Clearing token.');
              _retryCount = 0;
              clearSecureToken(function () {
                showDisconnectedState();
                updateStatus('Session expired. Reconnect.', 'warning');
              });
            }
          });
        } else {
          console.log('[POPUP] ❌ Already retried. Clearing token.');
          _retryCount = 0;
          clearSecureToken(function () {
            showDisconnectedState();
            updateStatus('Session expired. Reconnect.', 'warning');
          });
        }
        throw new Error('Token expired');
      }
      _retryCount = 0;
      if (!response.ok) throw new Error('API failed');
      return response.json();
    })
    .then(function (data) {
      console.log('[POPUP] ✅ Data received');
      notConnectedSection.style.display = 'none';
      connectedSection.style.display = 'block';
      promptCard.style.display = 'block';

      if (data.usage) {
        var userPlan = data.usage.tier || 'trial';
        var isUnlimited = (data.usage.limit >= 999999);

        var displayLimit = data.usage.limit || 20;

        // Cache for instant load next time
        chrome.storage.local.set({
          cachedPlan: userPlan,
          cachedUsed: data.usage.used || 0,
          cachedLimit: displayLimit
        });

        tierBadge.className = 'tier-badge tier-' + userPlan;

        // PRO badge: shimmer + gradient styling
        if (userPlan === 'pro') {
          tierBadge.textContent = '✨ PRO';
          tierBadge.style.background = 'linear-gradient(135deg, #8B5CF6, #D946EF)';
          tierBadge.style.color = '#fff';
          tierBadge.style.border = 'none';
          tierBadge.style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)';
          tierBadge.style.animation = 'proBadgeShimmer 2.5s ease-in-out infinite';
        } else {
          tierBadge.textContent = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);
          tierBadge.style.background = '';
          tierBadge.style.color = '';
          tierBadge.style.border = '';
          tierBadge.style.boxShadow = '';
          tierBadge.style.animation = '';
        }

        if (isUnlimited) {
          usageText.textContent = data.usage.used + ' replies · Unlimited ∞';
          usageFill.style.width = '100%';
          usageFill.classList.remove('usage-warning');
          usageFill.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
        } else {
          var prefix = (userPlan === 'trial' || userPlan === 'free') ? 'TRIAL: ' : '';
          usageText.textContent = prefix + data.usage.used + ' / ' + displayLimit + ' replies';
          var percentage = Math.min((data.usage.used / displayLimit) * 100, 100);
          usageFill.style.width = percentage + '%';
          usageFill.classList.remove('usage-warning');

          // Urgency colors to drive upgrades
          if (percentage > 90) {
            usageFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
          } else if (percentage > 75) {
            usageFill.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
          } else {
            usageFill.style.background = '';
          }
        }

        // Show "Manage Subscription" for Pro, "Upgrade to PRO" for trial/free
        var manageSubLink = document.getElementById('manageSubLink');
        var upgradeProBtn = document.getElementById('upgradeProBtn');
        if (userPlan === 'pro') {
          if (manageSubLink) manageSubLink.style.display = 'block';
          if (upgradeProBtn) upgradeProBtn.style.display = 'none';
        } else {
          if (manageSubLink) manageSubLink.style.display = 'none';
          if (upgradeProBtn) upgradeProBtn.style.display = 'block';
        }
      }

      if (data.prompts) {
        window._promptsCache = data.prompts; // all prompts (both platforms)
      }
      renderPromptsDropdown();

      // Enable prompt form
      customPromptName.disabled = false;
      customPromptContent.disabled = false;
      saveCustomPromptBtn.disabled = false;
      promptSelect.disabled = false;

      updateStatus('Connected', 'success');
    })
    .catch(function (error) {
//... (closing is below)
      if (error.message === 'Token expired') return;
      console.error('[POPUP] ❌ Connection failed. Error name:', error.name, '| Message:', error.message);
      console.error('[POPUP] ❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      showDisconnectedState();
      updateStatus('Connection failed: ' + (error.message || 'Unknown error'), 'error');
    });
}

// Draw prompt select list based on current platform
function renderPromptsDropdown() {
  if (!promptSelect) return;
  promptSelect.innerHTML = '<option value="">Use default prompt</option>';
  var defaultPromptId = null;

  var savedPromptId = syncDataCache['selectedPromptId_' + activePlatform];

  if (window._promptsCache) {
    window._promptsCache.forEach(function (prompt) {
      if (prompt.platform === activePlatform || (!prompt.platform && activePlatform === 'discord')) {
        var option = document.createElement('option');
        option.value = prompt.id;
        option.textContent = (prompt.is_default ? '📌 ' : '') + prompt.name;
        if (prompt.is_default) {
          defaultPromptId = prompt.id;
        }
        promptSelect.appendChild(option);
      }
    });
  }

  // Use saved selection, or fall back to the native default for this platform
  var targetPromptId = savedPromptId || defaultPromptId;
  if (targetPromptId) promptSelect.value = targetPromptId;
}

// Show disconnected
function showDisconnectedState() {
  notConnectedSection.style.display = 'block';
  connectedSection.style.display = 'none';

  // Disable prompt form instead of hiding
  customPromptName.disabled = true;
  customPromptContent.disabled = true;
  saveCustomPromptBtn.disabled = true;
  promptSelect.disabled = true;

  updateStatus('Ready', 'info');
}

// Connect
function connectAccount() {
  console.log('[POPUP] Connect clicked');
  chrome.tabs.create({ url: API_BASE + '/api/extension/auth' });
}

// Disconnect
function disconnectAccount() {
  console.log('[POPUP] Disconnect clicked');
  clearSecureToken(function () {
    showDisconnectedState();
    updateStatus('Disconnected', 'warning');
    showToast('Account disconnected');
  });
}

// Update status
function updateStatus(text, type) {
  var typeStr = type || 'info';
  var statusDot = statusEl.querySelector('.status-dot');
  var statusText = statusEl.querySelector('.status-text');
  
  if (statusText) statusText.textContent = text;
  if (statusDot) statusDot.className = 'status-dot status-' + typeStr;
  
  if (typeStr === 'error' || typeStr === 'warning') {
    statusEl.className = 'status status-pill pill-' + typeStr;
  } else {
    statusEl.className = 'status status-minimal';
  }
}

function saveSettings() {
  var settingsToSave = {
    language: languageSelect.value,
    length: lengthSelect.value,
    bannedWords: bannedWordsInput.value.trim(),
    includeHashtags: includeHashtagsCheckbox.checked,
    mentionAuthor: mentionAuthorCheckbox.checked,
    addEmoji: addEmojiCheckbox.checked,
    activePlatform: activePlatform
  };

  settingsToSave['selectedPromptId_' + activePlatform] = promptSelect.value || null;
  syncDataCache['selectedPromptId_' + activePlatform] = promptSelect.value || null;

  chrome.storage.sync.set(settingsToSave, function () {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      showToast('Failed to save', true);
      return;
    }
    showToast('Settings saved!');
    saveBtn.style.transform = 'scale(0.95)';
    setTimeout(function () { saveBtn.style.transform = ''; }, 150);
  });
}

// Toast
function showToast(message, isError) {
  var existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  var toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3000);
}

// ─── Prompt CRUD System ───
var promptSelectView = document.getElementById('promptSelectView');
var promptEditorView = document.getElementById('promptEditorView');
var editorTitle = document.getElementById('editorTitle');
var editPromptBtn = document.getElementById('editPromptBtn');
var newPromptBtn = document.getElementById('newPromptBtn');
var cancelEditBtn = document.getElementById('cancelEditBtn');
var deletePromptBtn = document.getElementById('deletePromptBtn');
var deleteConfirm = document.getElementById('deleteConfirm');
var confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
var cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

var editingPromptId = null; // null = create mode, string = edit mode

customPromptContent.addEventListener('input', function () {
  var len = this.value.length;
  charCounter.textContent = len + ' / 1000';
  charCounter.classList.toggle('limit-reached', len >= 1000);
});

function showSelectView() {
  promptSelectView.style.display = 'block';
  promptEditorView.style.display = 'none';
  deleteConfirm.style.display = 'none';
  customPromptName.value = '';
  customPromptContent.value = '';
  charCounter.textContent = '0 / 1000';
  editingPromptId = null;
}

function showEditorView(mode, id, name, content) {
  promptSelectView.style.display = 'none';
  promptEditorView.style.display = 'block';
  deleteConfirm.style.display = 'none';

  if (mode === 'edit') {
    editingPromptId = id;
    editorTitle.textContent = 'Edit Prompt';
    saveCustomPromptBtn.textContent = 'Update Prompt';
    deletePromptBtn.style.display = 'flex';
    customPromptName.value = name || '';
    customPromptContent.value = content || '';
    charCounter.textContent = (content || '').length + ' / 1000';
  } else {
    editingPromptId = null;
    editorTitle.textContent = 'New Prompt';
    saveCustomPromptBtn.textContent = 'Create Prompt';
    deletePromptBtn.style.display = 'none';
    customPromptName.value = '';
    customPromptContent.value = '';
    charCounter.textContent = '0 / 1000';
  }
}

// ➕ New Prompt
newPromptBtn.addEventListener('click', function () {
  showEditorView('create');
});

// ✏️ Edit selected prompt
editPromptBtn.addEventListener('click', function () {
  var selectedId = promptSelect.value;
  if (!selectedId) {
    showToast('Select a prompt to edit', true);
    return;
  }
  // Look up cached prompt data
  var cached = (window._promptsCache || []).find(function (p) { return p.id === selectedId; });
  var name = cached ? cached.name : '';
  var content = cached ? (cached.content || '') : '';
  showEditorView('edit', selectedId, name, content);
  // Place cursor at end of textarea
  customPromptContent.focus();
  customPromptContent.setSelectionRange(content.length, content.length);
});

// ✕ Cancel
cancelEditBtn.addEventListener('click', function () {
  showSelectView();
});

// 💾 Save (Create or Update)
saveCustomPromptBtn.addEventListener('click', function () {
  var name = customPromptName.value.trim();
  var content = customPromptContent.value.trim();
  if (!name) { showToast('Name is required', true); return; }

  var originalText = saveCustomPromptBtn.textContent;
  saveCustomPromptBtn.textContent = '⏳ Saving...';
  saveCustomPromptBtn.disabled = true;

  chrome.storage.local.get(['extToken'], function (result) {
    if (!result.extToken) {
      saveCustomPromptBtn.textContent = originalText;
      saveCustomPromptBtn.disabled = false;
      return;
    }

    var isEdit = !!editingPromptId;
    var method = isEdit ? 'PUT' : 'POST';
    var bodyData = isEdit
      ? { id: editingPromptId, name: name, content: content, platform: activePlatform }
      : { name: name, content: content, platform: activePlatform };

    fetch(API_BASE + '/api/extension/prompts', {
      method: method,
      headers: {
        'Authorization': 'Bearer ' + result.extToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          showToast(data.error, true);
          saveCustomPromptBtn.textContent = '❌ Error';
        } else {
          saveCustomPromptBtn.textContent = '✅ Saved!';
          var newId = data.prompt ? data.prompt.id : (editingPromptId || '');
          
          var updatePayload = {};
          updatePayload['selectedPromptId_' + activePlatform] = newId;
          chrome.storage.sync.set(updatePayload);
          syncDataCache['selectedPromptId_' + activePlatform] = newId;

          window.posthogTrackEvent && window.posthogTrackEvent('prompt_managed', { action: isEdit ? 'edit' : 'create' });
          // Return to select view and refresh prompts
          setTimeout(function () {
            showSelectView();
            checkAuthAndShowState(newId);
          }, 600);
        }
        setTimeout(function () {
          saveCustomPromptBtn.textContent = originalText;
          saveCustomPromptBtn.disabled = false;
        }, 800);
      })
      .catch(function (err) {
        console.error('[POPUP] Save error:', err);
        saveCustomPromptBtn.textContent = '❌ Error';
        showToast('Failed to save', true);
        setTimeout(function () {
          saveCustomPromptBtn.textContent = originalText;
          saveCustomPromptBtn.disabled = false;
        }, 1200);
      });
  });
});

// 🗑️ Delete button → show confirmation
deletePromptBtn.addEventListener('click', function () {
  deleteConfirm.style.display = 'block';
});

cancelDeleteBtn.addEventListener('click', function () {
  deleteConfirm.style.display = 'none';
});

// Confirm delete
confirmDeleteBtn.addEventListener('click', function () {
  if (!editingPromptId) return;

  confirmDeleteBtn.textContent = '⏳';
  confirmDeleteBtn.disabled = true;

  chrome.storage.local.get(['extToken'], function (result) {
    if (!result.extToken) return;

    fetch(API_BASE + '/api/extension/prompts?id=' + editingPromptId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + result.extToken }
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          showToast(data.error, true);
          confirmDeleteBtn.textContent = 'Delete';
          confirmDeleteBtn.disabled = false;
        } else {
          showToast('Prompt deleted');
          window.posthogTrackEvent && window.posthogTrackEvent('prompt_managed', { action: 'delete' });
          showSelectView();
          checkAuthAndShowState('');
        }
      })
      .catch(function (err) {
        console.error('[POPUP] Delete error:', err);
        showToast('Failed to delete', true);
        confirmDeleteBtn.textContent = 'Delete';
        confirmDeleteBtn.disabled = false;
      });
  });
});

// Event listeners
saveBtn.addEventListener('click', saveSettings);
connectBtn.addEventListener('click', connectAccount);
disconnectBtn.addEventListener('click', function (e) { e.preventDefault(); disconnectAccount(); });

// 🛡️ Banned words toggle
var toggleBannedWords = document.getElementById('toggleBannedWords');
var bannedWordsRow = document.getElementById('bannedWordsRow');
if (toggleBannedWords && bannedWordsRow) {
  toggleBannedWords.addEventListener('click', function () {
    var isOpen = bannedWordsRow.style.display !== 'none';
    bannedWordsRow.style.display = isOpen ? 'none' : 'block';
    toggleBannedWords.style.background = isOpen ? '#f8fafc' : '#ede9fe';
    toggleBannedWords.style.borderColor = isOpen ? '#e2e8f0' : '#c4b5fd';
  });
  // Auto-open if banned words already saved
  if (bannedWordsInput.value.trim()) {
    bannedWordsRow.style.display = 'block';
    toggleBannedWords.style.background = '#ede9fe';
    toggleBannedWords.style.borderColor = '#c4b5fd';
  }
}

// Save selected prompt as default
var saveDefaultBtn = document.getElementById('saveDefaultBtn');
if (saveDefaultBtn) {
  saveDefaultBtn.addEventListener('click', function () {
    var selectedId = promptSelect.value;
    if (!selectedId) {
      saveDefaultBtn.textContent = '⚠️';
      setTimeout(function () { saveDefaultBtn.innerHTML = '&#128190;'; }, 1000);
      return;
    }

    saveDefaultBtn.textContent = '⏳';
    saveDefaultBtn.style.opacity = '0.6';
    saveDefaultBtn.disabled = true;

    chrome.storage.local.get(['extToken'], function (result) {
      if (!result.extToken) {
        saveDefaultBtn.textContent = '❌';
        saveDefaultBtn.style.opacity = '1';
        saveDefaultBtn.disabled = false;
        setTimeout(function () { saveDefaultBtn.innerHTML = '&#128190;'; }, 1200);
        return;
      }

      fetch(API_BASE + '/api/extension/prompts/set-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + result.extToken
        },
        body: JSON.stringify({ promptId: selectedId })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          saveDefaultBtn.style.opacity = '1';
          saveDefaultBtn.disabled = false;

          if (data.error) {
            console.error('[POPUP] Set default failed:', data.error);
            saveDefaultBtn.textContent = '❌';
          } else {
            saveDefaultBtn.textContent = '✅';
            var updateObj = {};
            updateObj['selectedPromptId_' + activePlatform] = selectedId;
            syncDataCache['selectedPromptId_' + activePlatform] = selectedId;
            chrome.storage.sync.set(updateObj);
            
            var options = promptSelect.options;
            for (var i = 0; i < options.length; i++) {
              options[i].textContent = options[i].textContent.replace('📌 ', '');
              if (options[i].value === selectedId) {
                options[i].textContent = '📌 ' + options[i].textContent;
              }
            }
          }
          setTimeout(function () { saveDefaultBtn.innerHTML = '&#128190;'; }, 1200);
        })
        .catch(function (err) {
          console.error('[POPUP] Set default error:', err);
          saveDefaultBtn.style.opacity = '1';
          saveDefaultBtn.disabled = false;
          saveDefaultBtn.textContent = '❌';
          setTimeout(function () { saveDefaultBtn.innerHTML = '&#128190;'; }, 1200);
        });
    });
  });
}

// Listen for auth success
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log('[POPUP] Message:', message.type);
  if (message.type === 'AUTH_SUCCESS') {
    console.log('[POPUP] ✅ AUTH_SUCCESS - reloading');
    setTimeout(function () {
      checkAuthAndShowState(null);
    }, 500);
  }
  sendResponse({ received: true });
  return true;
});

// Listen for storage changes
chrome.storage.onChanged.addListener(function (changes, areaName) {
  console.log('[POPUP] Storage changed:', areaName, Object.keys(changes));

  if (changes.isConnected && changes.isConnected.newValue === true) {
    console.log('[POPUP] ✅ isConnected - reloading');
    setTimeout(function () {
      checkAuthAndShowState(null);
    }, 500);
  }

  if (changes.extToken || changes.userId) {
    console.log('[POPUP] ✅ Token changed - reloading');
    setTimeout(function () {
      checkAuthAndShowState(null);
    }, 500);
  }
});

// Initialize
loadSettings();
