import { useState, useEffect, useCallback } from 'react'
import { isLastFmConfigured, getLastFmSession, getAuthUrl, getSessionKey, clearLastFmSession, scrobbleTrack, updateNowPlaying } from '../lib/lastfm.js'

export function useLastFm() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = useCallback(() => {
    const session = getLastFmSession()
    setConnected(!!session && isLastFmConfigured())
  }, [])

  const connect = useCallback(() => {
    if (!isLastFmConfigured()) {
      setError('Last.fm API key not configured. Please add API_KEY and API_SECRET to lib/lastfm.js')
      return
    }
    setConnecting(true)
    window.location.href = getAuthUrl()
  }, [])

  const disconnect = useCallback(() => {
    clearLastFmSession()
    setConnected(false)
  }, [])

  const handleCallback = useCallback(async (token) => {
    try {
      setConnecting(true)
      const sessionKey = await getSessionKey(token)
      if (sessionKey) {
        setConnected(true)
        setError(null)
      } else {
        setError('Failed to authenticate')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setConnecting(false)
    }
  }, [])

  return { connected, connecting, error, connect, disconnect, handleCallback, isConfigured: isLastFmConfigured() }
}

export default function LastFmSettings({ isOpen, onClose }) {
  const { connected, connecting, error, connect, disconnect, isConfigured } = useLastFm()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-lg font-medium text-fg flex items-center gap-2">
            <i className="bi bi-lastfm text-accent" />
            Last.fm Scrobbling
          </h2>
          <button onClick={onClose} className="player-btn w-9 h-9" aria-label="Close">
            <i className="bi bi-x-lg text-base" />
          </button>
        </div>

        <div className="p-6">
          {!isConfigured && (
            <div className="mb-6 p-4 bg-amber-400/10 border border-amber-400/40 text-amber-400 rounded-xl text-sm">
              <strong>Setup required:</strong> Add your Last.fm API credentials to <code>src/lib/lastfm.js</code>.
              <br />Get them at <a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener" className="underline hover:text-amber-300">last.fm/api/account/create</a>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-400/10 border border-red-400/40 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${connected ? 'bg-accent-soft text-accent' : 'bg-border text-fg-muted'}`}>
                  <i className={`bi ${connected ? 'bi-check-lg' : 'bi-lastfm'} text-lg`} />
                </div>
                <div>
                  <p className="font-medium text-fg">Last.fm Account</p>
                  <p className="text-sm text-fg-muted">{connected ? 'Connected' : 'Not connected'}</p>
                </div>
              </div>
              {connected ? (
                <button
                  onClick={disconnect}
                  disabled={connecting}
                  className="px-4 py-2 text-sm rounded-xl border border-red-400/40 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={connecting || !isConfigured}
                  className="px-4 py-2 text-sm rounded-xl bg-accent text-accent-ink font-medium hover:bg-accent/85 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {connected && (
              <div className="p-4 bg-bg rounded-xl border border-border">
                <h3 className="font-medium text-fg mb-3">What gets scrobbled:</h3>
                <ul className="text-sm text-fg-muted space-y-1">
                  <li>• Tracks played for more than 50% or 4 minutes</li>
                  <li>• Now playing updates (live)</li>
                  <li>• Artist, title, album, duration</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}