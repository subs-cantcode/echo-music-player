import { useState, useRef, useCallback } from 'react'
import { uploadTrack } from '../lib/api.js'

function bytesToLabel(bytes) {
  if (!bytes && bytes !== 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

// States: 'empty' | 'review' | 'uploading'

export default function UploadZone({ onUpload }) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState('empty') // empty | review | uploading

  // Review state
  const [selectedFiles, setSelectedFiles] = useState([])

  // Uploading state
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const acceptAudio = useCallback((fileList) => {
    return Array.from(fileList).filter((f) => f.type.startsWith('audio/'))
  }, [])

  const handleFiles = useCallback((files) => {
    const audioFiles = acceptAudio(files)
    if (audioFiles.length === 0) return
    setSelectedFiles(audioFiles)
    setPhase('review')
  }, [acceptAudio])

  const removeFile = useCallback((index) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) setPhase('empty')
      return next
    })
  }, [])

  const cancelSelection = useCallback(() => {
    setSelectedFiles([])
    setPhase('empty')
  }, [])

  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return

    // Build uploading file list with status tracking
    const files = selectedFiles.map((f) => ({
      file: f,
      name: f.name,
      size: f.size,
      status: 'pending', // pending | uploading | done | error
      progress: 0,
      error: null,
    }))
    setUploadingFiles(files)
    setPhase('uploading')
    setIsUploading(true)

    // Upload sequentially
    for (let i = 0; i < files.length; i++) {
      setUploadingFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading', progress: 50 } : f))
      )

      try {
        await uploadTrack({
          blob: files[i].file,
          file: files[i].file,
          originalName: files[i].name,
          title: undefined,
        })
        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'done', progress: 100 } : f))
        )
      } catch (err) {
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', error: err.message || 'Upload failed' } : f
          )
        )
      }
    }

    setIsUploading(false)

    // Brief pause so user can see final state, then reset
    await new Promise((r) => setTimeout(r, 800))

    setUploadingFiles([])
    setSelectedFiles([])
    setPhase('empty')

    // Notify parent to refresh library
    if (onUpload) onUpload()
  }, [selectedFiles, onUpload])

  const retryFile = useCallback(async (index) => {
    setUploadingFiles((prev) =>
      prev.map((f, idx) => (idx === index ? { ...f, status: 'uploading', progress: 50, error: null } : f))
    )
    const file = uploadingFiles[index]
    try {
      await uploadTrack({
        blob: file.file,
        file: file.file,
        originalName: file.name,
        title: undefined,
      })
      setUploadingFiles((prev) =>
        prev.map((f, idx) => (idx === index ? { ...f, status: 'done', progress: 100 } : f))
      )
    } catch (err) {
      setUploadingFiles((prev) =>
        prev.map((f, idx) =>
          idx === index ? { ...f, status: 'error', error: err.message || 'Upload failed' } : f
        )
      )
    }
  }, [uploadingFiles])

  return (
    <section className="bg-panel p-6">
      {/* ── Empty state ── */}
      {phase === 'empty' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-accent' : 'border-border hover:border-accent'
          }`}
        >
          <i className="bi bi-cloud-upload text-3xl text-text-secondary opacity-60 mb-2 block" />
          <p className="font-semibold text-text-primary mb-1">Upload music</p>
          <p className="text-text-secondary text-sm">Drag &amp; drop audio files, or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files.length) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* ── Review state ── */}
      {phase === 'review' && (
        <div className="upload-zone-enter border border-border rounded-lg px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">
              <span className="text-accent font-semibold">{selectedFiles.length}</span>
              {' '}file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          <div className="flex flex-col gap-1 mb-5">
            {selectedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between py-2 px-3 rounded bg-background"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-secondary">{bytesToLabel(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-text-secondary hover:text-text-primary transition-colors p-1 flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={startUpload}                className="px-5 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 btn-press transition-colors"
            >
              Upload
            </button>
            <button
              onClick={cancelSelection}                className="text-text-secondary text-sm hover:text-text-primary btn-press transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Uploading state ── */}
      {phase === 'uploading' && (
        <div className="upload-zone-enter border border-border rounded-lg px-5 py-5">
          <div className="flex flex-col gap-2">
            {uploadingFiles.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="flex items-center justify-between py-2 px-3 rounded bg-background"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-text-primary truncate">{f.name}</p>
                    {f.status === 'done' && (
                      <i className="bi bi-check-circle-fill text-accent text-xs flex-shrink-0" />
                    )}
                    {f.status === 'error' && (
                      <i className="bi bi-exclamation-circle-fill text-red-500 text-xs flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {f.status === 'error' ? (
                      <span className="text-red-500">{f.error}</span>
                    ) : (
                      bytesToLabel(f.size)
                    )}
                  </p>
                  {/* Progress bar */}
                  {f.status === 'uploading' && (
                    <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-300"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}
                  {f.status === 'done' && (
                    <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full w-full" />
                    </div>
                  )}
                </div>
                {f.status === 'error' && (
                  <button
                    onClick={() => retryFile(i)}
                    className="text-accent text-xs font-medium hover:underline btn-press flex-shrink-0 ml-2"
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
