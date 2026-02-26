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

console.log('[POPUP] Initializing...');

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
  chrome.storage.local.remove(['extToken', 'userId'], function () {
    chrome.storage.sync.remove(['userId', 'extToken', 'selectedPromptId', 'isConnected'], function () {
      console.log('[POPUP] ✅ Token cleared');
      if (callback) callback();
    });
  });
}

// Load settings
function loadSettings() {
  console.log('[POPUP] loadSettings');
  chrome.storage.sync.get([
    'language', 'length', 'bannedWords',
    'includeHashtags', 'mentionAuthor', 'addEmoji', 'selectedPromptId',
    'customPromptName', 'customPromptContent'
  ], function (result) {
    if (result.language) languageSelect.value = result.language;
    if (result.length) lengthSelect.value = result.length;
    if (result.bannedWords) bannedWordsInput.value = result.bannedWords;
    if (result.customPromptName) customPromptName.value = result.customPromptName;
    if (result.customPromptContent) {
      customPromptContent.value = result.customPromptContent;
      charCounter.textContent = result.customPromptContent.length + ' / 500';
    }

    includeHashtagsCheckbox.checked = result.includeHashtags || false;
    mentionAuthorCheckbox.checked = result.mentionAuthor !== undefined ? result.mentionAuthor : true;
    addEmojiCheckbox.checked = result.addEmoji !== undefined ? result.addEmoji : true;

    checkAuthAndShowState(result.selectedPromptId);
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

      // Aggressively aggressively poll for token while disconnected
      // BUT route it directly through the background script to bypass CSP blocks!
      if (!authCheckInterval) {
        authCheckInterval = setInterval(() => {
          chrome.runtime.sendMessage({ type: 'EXTRACT_TOKEN' }, function (response) {
            if (chrome.runtime.lastError) return;

            if (response && response.ok && response.token && response.userId) {
              console.log('[POPUP] ✅ Token extracted directly via background fetch API!');
              clearInterval(authCheckInterval);
              // Background already stored it, so we just run the checker again
              checkAuthAndShowState(selectedPromptId);
            }
          });
        }, 1500);
      }
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

        tierBadge.textContent = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);
        tierBadge.className = 'tier-badge tier-' + userPlan;

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
          usageFill.style.background = '';
          if (percentage > 80) {
            usageFill.classList.add('usage-warning');
          } else {
            usageFill.classList.remove('usage-warning');
          }
        }
      }

      promptSelect.innerHTML = '<option value="">Use default prompt</option>';
      if (data.prompts) {
        data.prompts.forEach(function (prompt) {
          var option = document.createElement('option');
          option.value = prompt.id;
          option.textContent = prompt.name + (prompt.is_default ? ' (Default)' : '');
          promptSelect.appendChild(option);
        });
      }
      if (selectedPromptId) promptSelect.value = selectedPromptId;

      // Enable prompt form
      customPromptName.disabled = false;
      customPromptContent.disabled = false;
      saveCustomPromptBtn.disabled = false;
      promptSelect.disabled = false;

      updateStatus('Connected', 'success');
    })
    .catch(function (error) {
      if (error.message === 'Token expired') return;
      console.error('[POPUP] ❌ Connection failed. Error name:', error.name, '| Message:', error.message);
      console.error('[POPUP] ❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      showDisconnectedState();
      updateStatus('Connection failed: ' + (error.message || 'Unknown error'), 'error');
    });
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
  var statusDot = statusEl.querySelector('.status-dot');
  var statusText = statusEl.querySelector('.status-text');
  if (statusText) statusText.textContent = text;
  if (statusDot) statusDot.className = 'status-dot status-' + (type || 'info');
}

// Save settings
function saveSettings() {
  var settingsToSave = {
    language: languageSelect.value,
    length: lengthSelect.value,
    bannedWords: bannedWordsInput.value.trim(),
    includeHashtags: includeHashtagsCheckbox.checked,
    mentionAuthor: mentionAuthorCheckbox.checked,
    addEmoji: addEmojiCheckbox.checked,
    selectedPromptId: promptSelect.value || null
  };

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

// Custom Prompt handlers
customPromptContent.addEventListener('input', function () {
  var len = this.value.length;
  charCounter.textContent = len + ' / 500';
  if (len >= 500) {
    charCounter.classList.add('limit-reached');
  } else {
    charCounter.classList.remove('limit-reached');
  }
});

saveCustomPromptBtn.addEventListener('click', function () {
  var name = customPromptName.value.trim();
  var content = customPromptContent.value.trim();

  if (!name || !content) {
    showToast('Name and content are required', true);
    return;
  }

  var originalText = saveCustomPromptBtn.textContent;
  saveCustomPromptBtn.textContent = 'Saving...';
  saveCustomPromptBtn.disabled = true;

  getSecureToken(function (tokenResult) {
    if (!tokenResult.extToken || !tokenResult.userId) {
      saveCustomPromptBtn.textContent = originalText;
      saveCustomPromptBtn.disabled = false;
      showToast('You must be connected to save prompts', true);
      return;
    }

    fetch(API_BASE + '/api/extension/prompts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + tokenResult.extToken,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name: name, content: content })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            try {
              var err = JSON.parse(text);
              throw new Error(err.error || 'Failed to save');
            } catch (e) {
              throw new Error('API Endpoint Not Deployed');
            }
          });
        }
        return response.json();
      })
      .then(function (data) {
        // Success State Animation Triggered
        saveCustomPromptBtn.textContent = '✅ Saved!';
        saveCustomPromptBtn.classList.add('success');

        // Also set selected prompt id to the newly created one!
        chrome.storage.sync.set({ selectedPromptId: data.prompt.id }, function () {
          // Clear local inputs to prevent accidental duplicates
          customPromptName.value = '';
          customPromptContent.value = '';
          charCounter.textContent = '0 / 500';

          // Re-fetch the dropdown so the new prompt is available immediately
          checkAuthAndShowState(data.prompt.id);

          setTimeout(function () {
            saveCustomPromptBtn.textContent = originalText;
            saveCustomPromptBtn.classList.remove('success');
            saveCustomPromptBtn.disabled = false;
          }, 1500);
        });
      })
      .catch(function (error) {
        saveCustomPromptBtn.textContent = '❌ Error';
        saveCustomPromptBtn.classList.add('error');
        showToast(error.message, true);
        setTimeout(function () {
          saveCustomPromptBtn.textContent = originalText;
          saveCustomPromptBtn.classList.remove('error');
          saveCustomPromptBtn.disabled = false;
        }, 1500);
      });
  });
});

// Event listeners
saveBtn.addEventListener('click', saveSettings);
connectBtn.addEventListener('click', connectAccount);
disconnectBtn.addEventListener('click', disconnectAccount);

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

