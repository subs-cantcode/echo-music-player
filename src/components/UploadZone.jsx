import { useState, useRef } from 'react'
import { formatTime } from '../components/NowPlaying.jsx'

export default function UploadZone({ onUpload }) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = async (files) => {
    const audioFiles = Array.from(files).filter((f) => f.type.startsWith('audio/'))
    if (audioFiles.length === 0) return
    await onUpload(audioFiles)
  }

  return (
    <section className="bg-panel p-6">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-accent' : 'border-border hover:border-accent'}`}
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
    </section>
  )
}
