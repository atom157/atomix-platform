// Auto-connect extension when landing on the extension-connected page
// Content scripts DON'T have access to chrome.storage.session!
// We must use chrome.storage.local for the token.
(function () {
  'use strict';

  console.log('[AUTH] extension-auth.js: Script loaded');

  // Check if Chrome extension APIs are available
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error('[AUTH] Chrome storage API not available');
    return;
  }

  console.log('[AUTH] Chrome APIs detected');

  // CRITICAL: Content scripts can ONLY use local and sync storage!
  // chrome.storage.session is NOT accessible from content scripts!
  var secureStorage = chrome.storage.local;
  console.log('[AUTH] Using storage: local (session not available in content scripts)');

  // Wait for DOM to be fully ready
  function initAuth() {
    var authEl = document.getElementById('extension-auth-data');
    if (!authEl) {
      console.error('[AUTH] extension-auth-data element not found');
      return;
    }

    console.log('[AUTH] Found auth element, polling for token...');

    var attempts = 0;
    var maxAttempts = 50; // 50 * 200ms = 10 seconds

    var interval = setInterval(function () {
      attempts++;

      var token = authEl.getAttribute('data-ext-token');
      var userId = authEl.getAttribute('data-user-id');

      if (token && userId) {
        clearInterval(interval);
        console.log('TOKEN_CAPTURED_ON_GURU');
        console.log('[AUTH] ✅ Token found! userId:', userId);

        // Clear legacy storage before saving
        secureStorage.remove(['extToken', 'userId'], function () {
          // Store in LOCAL storage (not session - not available in content scripts)
          secureStorage.set(
            { extToken: token, userId: userId },
            function () {
              if (chrome.runtime.lastError) {
                console.error('[AUTH] ❌ Error storing token:', chrome.runtime.lastError.message);

                // Show error to user
                var statusEl = document.getElementById('extension-auth-status');
                if (statusEl) {
                  statusEl.textContent = 'Storage error: ' + chrome.runtime.lastError.message;
                  statusEl.style.color = '#ef4444';
                }
                return;
              }

              console.log('[AUTH] ✅ Token stored in local storage');

              // Store userId in sync for cross-device persistence
              chrome.storage.sync.set({ userId: userId, isConnected: true }, function () {
                if (chrome.runtime.lastError) {
                  console.error('[AUTH] ⚠️ Error storing userId in sync (non-critical):', chrome.runtime.lastError.message);
                } else {
                  console.log('[AUTH] ✅ UserId synced');
                }

                // Remove token from DOM for security
                authEl.removeAttribute('data-ext-token');

                // Notify any open popup
                try {
                  chrome.runtime.sendMessage({
                    type: 'AUTH_SUCCESS',
                    userId: userId
                  }, function (response) {
                    if (chrome.runtime.lastError) {
                      console.log('[AUTH] No popup listening (normal)');
                    } else {
                      console.log('[AUTH] ✅ Popup notified');
                    }
                  });
                } catch (e) {
                  console.log('[AUTH] Could not send message:', e.message);
                }

                // Update status on page
                var statusEl = document.getElementById('extension-auth-status');
                if (statusEl) {
                  statusEl.textContent = 'Connected successfully! You can close this tab.';
                  statusEl.style.color = '#22c55e';
                  statusEl.style.fontWeight = '600';
                }
              });
            }
          );
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error('[AUTH] ❌ Timeout after', attempts, 'attempts');
        var statusEl = document.getElementById('extension-auth-status');
        if (statusEl) {
          statusEl.textContent = 'Connection timed out. Please refresh the page.';
          statusEl.style.color = '#ef4444';
        }
      } else if (attempts % 5 === 0) {
        console.log('[AUTH] Still polling... attempt', attempts);
      }
    }, 200);
  }

  // Also listen for postMessage as fallback
  window.addEventListener('message', function (event) {
    if (!event.origin.includes('atomix.guru') && event.origin !== window.location.origin) return;

    if (event.data && event.data.type === 'XREPLY_AUTH_TOKEN') {
      console.log('[AUTH] Received token via postMessage');
      var token = event.data.token;
      var userId = event.data.userId;

      if (token && userId) {
        // Clear legacy storage before saving
        chrome.storage.local.remove(['extToken', 'userId'], function () {
          // Explictly store in LOCAL storage and VERIFY it immediately
          chrome.storage.local.set({ extToken: token, userId: userId }, function () {
            if (chrome.runtime.lastError) {
              console.error('[AUTH] ❌ Error storing token via postMessage:', chrome.runtime.lastError.message);
              return;
            }
            console.log('[AUTH] ✅ Token saved to local storage via postMessage');

            // Verify it wrote properly
            chrome.storage.local.get(['extToken'], function (res) {
              if (res.extToken) console.log('[AUTH] ✅ Verification passed. Token is resident in local context.');
            });

            chrome.storage.sync.set({ userId: userId, isConnected: true }, function () {
              if (chrome.runtime.lastError) {
                console.error('[AUTH] ⚠️ Error syncing userId:', chrome.runtime.lastError.message);
              } else {
                console.log('[AUTH] ✅ UserId synced via postMessage');
              }

              try {
                chrome.runtime.sendMessage({
                  type: 'AUTH_SUCCESS',
                  userId: userId
                });
              } catch (e) {
                console.log('[AUTH] Could not send message to popup (this is fine if closed):', e.message);
              }

              var statusEl = document.getElementById('extension-auth-status');
              if (statusEl) {
                statusEl.textContent = 'Connected successfully! You can close this tab.';
                statusEl.style.color = '#22c55e';
                statusEl.style.fontWeight = '600';
              }
            });
          });
        });
      }
    }
  });

  // Start auth flow
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
