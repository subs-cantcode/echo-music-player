import { useEffect } from 'react'
import { getLastFmSession, setLastFmSession } from '../lib/lastfm.js'

export default function LastFmCallback({ onSuccess }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      const checkSession = async () => {
        try {
          const res = await fetch(`${window.location.origin}/api/lastfm/session?token=${token}`)
          const data = await res.json()
          if (data.sessionKey) {
            setLastFmSession(data.sessionKey)
            onSuccess?.()
          }
        } catch (e) {
          console.error('Last.fm callback error:', e)
        }
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      checkSession()
    }
  }, [onSuccess])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-fg-muted">Completing Last.fm authorization...</p>
      </div>
    </div>
  )
}