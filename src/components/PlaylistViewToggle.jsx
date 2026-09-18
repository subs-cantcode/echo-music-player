const VIEWS = [
  { value: 'card', icon: 'bi-grid', label: 'Card view' },
  { value: 'list', icon: 'bi-list-ul', label: 'List view' },
]

export const PlaylistViewToggle = ({ view, onToggle }) => {
  return (
    <div className="flex items-center gap-0.5">
      {VIEWS.map((option) => (
        <button
          key={option.value}
          onClick={() => onToggle(option.value)}
          className={`player-btn w-8 h-8 ${
            view === option.value ? 'bg-accent-soft text-accent-text' : ''
          }`}
          title={option.label}
          aria-label={option.label}
          aria-pressed={view === option.value}
        >
          <i className={`bi ${option.icon} text-sm`} />
        </button>
      ))}
    </div>
  )
}

export default PlaylistViewToggle
