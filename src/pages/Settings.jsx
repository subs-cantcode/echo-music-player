export default function Settings() {
  // Storage usage display — read from the profile via Supabase
  // For now, show a read-only display since no real limit is enforced

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-panel p-6">
        <h2 className="text-base font-semibold mb-4">Settings</h2>

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
