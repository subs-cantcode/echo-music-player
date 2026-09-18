import { useTheme } from '../lib/ThemeContext.jsx'

export default function Settings() {
  const { theme, setTheme } = useTheme()

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
          <p>Echo is designed around local music. Your audio files remain on your device and are never uploaded to a server.</p>
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
