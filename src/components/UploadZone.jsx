import { useState, useRef, useCallback } from 'react'
import { useLibrary } from '../lib/LibraryContext.jsx'
import { extractMetadata } from '../lib/extractMetadata'

function bytesToLabel(bytes) {
  if (!bytes && bytes !== 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) { value /= 1024; idx++ }
  return `${value.toFixed(value >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

export default function UploadZone({ onUpload }) {
  const { addTrack } = useLibrary()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState('empty')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const acceptAudio = useCallback((fileList) =>
    Array.from(fileList).filter((f) => f.type.startsWith('audio/')), [])

  const handleFiles = useCallback((files) => {
    const audio = acceptAudio(files)
    if (audio.length === 0) return
    setSelectedFiles(audio)
    setPhase('review')
  }, [acceptAudio])

  const removeFile = useCallback((index) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) setPhase('empty')
      return next
    })
  }, [])

  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return
    const files = selectedFiles.map((f) => ({
      file: f, name: f.name, size: f.size, status: 'pending', progress: 0, error: null,
    }))
    setUploadingFiles(files)
    setPhase('uploading')
    setIsUploading(true)

    for (let i = 0; i < files.length; i++) {
      setUploadingFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading', progress: 50 } : f))
      try {
        const file = files[i].file
        const extracted = await extractMetadata(file)

        const metadata = {
          title: extracted.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: extracted.artist || 'Unknown Artist',
          album: extracted.album || 'Unknown Album',
          genre: extracted.genre || 'Uncategorized',
          year: extracted.year || new Date().getFullYear(),
          duration: extracted.duration || 0,
          artwork: extracted.artworkDataUrl || null,
        }

        await addTrack(file, metadata)
        setUploadingFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'done', progress: 100 } : f))
      } catch (err) {
        setUploadingFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message || 'Failed' } : f))
      }
    }

    setIsUploading(false)
    await new Promise((r) => setTimeout(r, 600))
    setUploadingFiles([])
    setSelectedFiles([])
    setPhase('empty')
    if (onUpload) onUpload()
  }, [selectedFiles, onUpload, addTrack])

  if (phase === 'empty') {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-accent bg-accent-soft' : 'border-border hover:border-accent hover:bg-accent-soft'
        }`}
      >
        <i className="bi bi-cloud-upload text-3xl text-fg-faint mb-3 block" />
        <p className="text-sm font-medium text-fg mb-1">Drop your music here</p>
        <p className="text-xs text-fg-muted">or click to browse files</p>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files.length) handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>
    )
  }

  if (phase === 'review') {
    return (
      <div className="border border-border rounded-xl px-5 py-4 fade-in">
        <p className="text-xs text-fg-muted mb-3">
          <span className="text-accent-text font-medium">{selectedFiles.length}</span> file{selectedFiles.length !== 1 ? 's' : ''} selected
        </p>
        <div className="flex flex-col gap-1 mb-4 max-h-48 overflow-y-auto">
          {selectedFiles.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm text-fg truncate">{file.name}</p>
                <p className="text-xs text-fg-muted">{bytesToLabel(file.size)}</p>
              </div>
              <button onClick={() => removeFile(i)} className="text-fg-faint hover:text-fg p-1 transition-colors" aria-label={`Remove ${file.name}`}>
                <i className="bi bi-x-lg text-xs" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={startUpload} className="px-5 py-2 bg-accent text-accent-ink text-sm font-medium rounded-lg hover:bg-accent/85 active:scale-[0.97] transition-all duration-150">
            Import
          </button>
          <button onClick={() => { setSelectedFiles([]); setPhase('empty') }} className="px-4 py-2 text-fg-muted text-sm hover:text-fg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl px-5 py-4 fade-in">
      <div className="flex flex-col gap-2">
        {uploadingFiles.map((f, i) => (
          <div key={`${f.name}-${i}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg">
            <div className="min-w-0 flex-1 mr-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-fg truncate">{f.name}</p>
                {f.status === 'done' && <i className="bi bi-check-circle-fill text-accent-text text-xs" />}
                {f.status === 'error' && <i className="bi bi-exclamation-circle-fill text-red-400 text-xs" />}
              </div>
              <p className="text-xs text-fg-muted">
                {f.status === 'error' ? <span className="text-red-400">{f.error}</span> : bytesToLabel(f.size)}
              </p>
              {f.status === 'uploading' && (
                <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${f.progress}%` }} />
                </div>
              )}
              {f.status === 'done' && (
                <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full w-full" />
                </div>
              )}
            </div>
            {f.status === 'error' && (
              <button onClick={() => {
                setUploadingFiles((prev) => prev.map((f2, idx) => idx === i ? { ...f2, status: 'pending', error: null } : f2))
              }} className="text-accent-text text-xs hover:underline">
                Retry
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
