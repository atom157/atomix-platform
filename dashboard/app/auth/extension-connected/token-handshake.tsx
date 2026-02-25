'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Client component that calls the /api/extension/token endpoint
 * and stores the result in a hidden DOM element for the extension
 * content script (extension-auth.js) to read.
 *
 * No raw user ID is exposed in the DOM. Instead, the extension
 * receives a cryptographically random, hashed-server-side token.
 */
export function ExtensionTokenHandshake() {
  const hasRun = useRef(false)
  const [status, setStatus] = useState('Generating secure token...')
  const [isError, setIsError] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [authData, setAuthData] = useState<{ token: string; userId: string } | null>(null)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    console.log('[v0] TokenHandshake: Starting token generation')

    async function generateToken() {
      try {
        console.log('[v0] TokenHandshake: Calling /api/extension/token')
        const res = await fetch('/api/extension/token', { method: 'POST' })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[v0] TokenHandshake: API error', err)
          throw new Error(err.error || 'Token generation failed')
        }

        const { token, userId } = await res.json()
        console.log('[v0] TokenHandshake: Token received, userId:', userId)

        // Write token data to DOM attributes for extension-auth.js
        const dataEl = document.getElementById('extension-auth-data')
        if (dataEl) {
          dataEl.setAttribute('data-ext-token', token)
          dataEl.setAttribute('data-user-id', userId)
          console.log('[v0] TokenHandshake: Token written to DOM')
        } else {
          console.error('[v0] TokenHandshake: extension-auth-data element not found')
        }

        setAuthData({ token, userId })

        setStatus('Waiting for extension to sync...')
        setIsError(false)

        // Try to trigger a storage event manually for the extension
        // This works if the extension has already set up storage before
        try {
          // Dispatch a custom event that popup.js can listen for
          window.postMessage({
            type: 'XREPLY_AUTH_TOKEN',
            token: token,
            userId: userId
          }, '*')
          console.log('[v0] TokenHandshake: Posted message to window')
        } catch (e) {
          console.error('[v0] TokenHandshake: Failed to post message:', e)
        }

        // Check if the extension picked up the token after 3 seconds
        setTimeout(() => {
          const currentToken = dataEl?.getAttribute('data-ext-token')
          if (currentToken) {
            console.log('[v0] TokenHandshake: Token still in DOM after 3s - extension script not running')
            setShowHelp(true)
            setStatus('Extension not detected')
          }
        }, 3000)

      } catch (err) {
        console.error('[v0] TokenHandshake: Error', err)
        setStatus(
          err instanceof Error
            ? err.message
            : 'Failed to generate token. Please try again.'
        )
        setIsError(true)
      }
    }

    generateToken()
  }, [])

  const handleOpenExtension = () => {
    alert('Now click the X Reply Generator extension icon in your browser toolbar to complete the connection.')
  }

  if (showHelp) {
    return (
      <div className="flex flex-col gap-4 max-w-md">
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm font-semibold mb-3">Complete the connection:</p>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2 mb-4">
            <li>Click the <strong>X Reply Generator</strong> icon in your browser toolbar</li>
            <li>The extension popup will detect your authentication automatically</li>
          </ol>
          <Button
            onClick={handleOpenExtension}
            className="w-full"
          >
            Open Extension Popup
          </Button>
        </div>

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium mb-2">Still not working? Try this:</summary>
          <ol className="list-decimal list-inside space-y-1.5 mt-2 ml-2">
            <li>Open <kbd className="px-1 py-0.5 rounded bg-muted">chrome://extensions</kbd></li>
            <li>Find &quot;X Reply Generator&quot;</li>
            <li>Click the reload icon (circular arrow)</li>
            <li>Close and reopen the extension popup</li>
          </ol>
        </details>
      </div>
    )
  }

  return (
    <>
      <p
        id="extension-auth-status"
        className="text-sm text-muted-foreground"
        style={{ color: isError ? '#ef4444' : undefined }}
      >
        {status}
      </p>
      {authData && (
        <>
          <input type="hidden" id="__ATOMIX_TOKEN__" value={authData.token} />
          <input type="hidden" id="__ATOMIX_USER_ID__" value={authData.userId} />
        </>
      )}
    </>
  )
}
