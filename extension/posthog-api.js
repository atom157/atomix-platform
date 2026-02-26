/**
 * Lightweight native fetch wrapper for PostHog API to support Manifest V3
 * Background service workers and popup scripts without a bundler.
 */

// We fetch these from a config file or inject at build time in production
const POSTHOG_KEY = 'YOUR_POSTHOG_API_KEY';
const POSTHOG_HOST = 'https://us.i.posthog.com';

/**
 * Generate a distinct ID for this installation and store it safely in chrome.storage.local
 */
async function getDistinctId() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['posthog_distinct_id'], (result) => {
            if (result.posthog_distinct_id) {
                resolve(result.posthog_distinct_id);
            } else {
                const newId = crypto.randomUUID();
                chrome.storage.local.set({ posthog_distinct_id: newId }, () => {
                    resolve(newId);
                });
            }
        });
    });
}

/**
 * Track an event to PostHog via native fetch
 * @param {string} eventName The name of the event
 * @param {object} properties Properties to send with the event
 */
export async function trackEvent(eventName, properties = {}) {
    if (POSTHOG_KEY === 'YOUR_POSTHOG_API_KEY') {
        console.log('[PostHog (Mock)] trackEvent:', eventName, properties);
        return;
    }

    try {
        const distinctId = await getDistinctId();
        const payload = {
            api_key: POSTHOG_KEY,
            event: eventName,
            properties: {
                distinct_id: distinctId,
                $lib: 'atomix-mv3-fetch',
                $ip: '127.0.0.1', // Ensure IP is anonymized server-side too
                ...properties
            },
            timestamp: new Date().toISOString()
        };

        await fetch(`${POSTHOG_HOST}/capture/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('Failed to send PostHog event:', e);
    }
}
