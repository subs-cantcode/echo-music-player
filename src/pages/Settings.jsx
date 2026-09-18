import { useState } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { useLibrary } from '../lib/LibraryContext.jsx'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { clearAllData } = useLibrary()
  const [clearing, setClearing] = useState(false)

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      'Are you sure? This will delete all your music and playlists from Echo.'
    )
    if (!confirmed || clearing) return

    setClearing(true)
    try {
      await clearAllData()
      // Reload so in-memory state (recently played, current track) resets too.
      window.location.reload()
    } catch (err) {
      console.error('Failed to clear data:', err)
      setClearing(false)
    }
  }

  return (
    <div className="page-enter">
      <h1 className="text-xl font-medium text-fg mb-5">Settings</h1>

      <section className="bg-surface rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-medium text-fg mb-3">Appearance</h2>
        <div className="flex gap-2">
          {[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`px-4 py-2 text-sm rounded-xl border transition-all duration-150 ${
                theme === opt.value
                  ? 'border-accent bg-accent-soft text-accent font-medium'
                  : 'border-border text-fg-muted hover:border-fg-faint hover:text-fg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-surface rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-medium text-fg mb-3">Privacy</h2>
        <div className="text-sm text-fg-muted leading-relaxed">
          <p className="font-medium text-fg mb-1">Your music is yours.</p>
          <p>
            Echo is designed around local music. Your audio files and library stay on your device,
            stored in your browser. They are never sent to a server or cloud storage.
          </p>
        </div>
        <div className="border-t border-border-subtle mt-4 pt-4">
          <p className="text-xs text-fg-faint mb-3">
            Clearing removes every imported track, playlist, and your listening history from this
            browser. This cannot be undone.
          </p>
          <button
            onClick={handleClearAllData}
            disabled={clearing}
            className="px-4 py-2 text-sm rounded-xl border border-red-400/40 text-red-400 hover:bg-red-400/10 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
          >
            {clearing ? 'Clearing…' : 'Clear all data'}
          </button>
        </div>
      </section>

      <section className="bg-surface rounded-2xl p-5">
        <h2 className="text-sm font-medium text-fg mb-3">About</h2>
        <div className="text-sm text-fg-muted space-y-1">
          <p><span className="text-fg font-medium">Echo</span> v1.0.0</p>
          <p>Your space. Your echo.</p>
        </div>
      </section>
    </div>
  )
}
