import { useTheme } from '../lib/ThemeContext.jsx'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-panel p-6">
        <h2 className="text-base font-semibold mb-4">Settings</h2>

        {/* Theme toggle */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-primary mb-2">Appearance</h3>
          <div className="bg-background border border-border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary font-medium">Theme</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full bg-border transition-colors duration-200 focus:outline-none"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-accent shadow-sm transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Storage */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-primary mb-2">Storage</h3>
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Usage</span>
              <span className="text-text-primary font-medium">Loading…</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-text-secondary text-xs mt-2">
              Storage tracking is active. No limit is enforced yet.
            </p>
          </div>
        </div>

        {/* About */}
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-2">About</h3>
          <div className="bg-background border border-border rounded-lg p-4 text-sm text-text-secondary space-y-1">
            <p><span className="text-text-primary font-medium">Echo Music Player</span> v1.0.0</p>
            <p>Built with React + Vite + Tailwind CSS</p>
            <p>Powered by Supabase</p>
          </div>
        </div>
      </section>
    </div>
  )
}
