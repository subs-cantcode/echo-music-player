import UploadZone from '../components/UploadZone.jsx'

export default function Upload({ onUploaded }) {
  return (
    <div className="page-enter">
      <div className="bg-surface rounded-2xl p-5 mb-4">
        <h1 className="text-xl font-medium text-fg mb-1">Import Music</h1>
        <p className="text-fg-muted text-sm">
          Add audio files from your device. Nothing is uploaded — your music stays in this browser.
        </p>
      </div>
      <UploadZone onUpload={onUploaded} />
    </div>
  )
}
