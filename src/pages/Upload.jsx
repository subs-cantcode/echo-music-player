import UploadZone from '../components/UploadZone.jsx'

export default function Upload({ onUploaded }) {
  return (
    <div className="page-enter">
      <div className="bg-surface rounded-2xl p-5 mb-4">
        <h1 className="text-xl font-medium text-fg mb-1">Upload Music</h1>
        <p className="text-fg-muted text-sm">
          Import audio files into your library. Your music stays on your device.
        </p>
      </div>
      <UploadZone onUpload={onUploaded} />
    </div>
  )
}
