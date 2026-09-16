import UploadZone from '../components/UploadZone.jsx'

export default function Upload({ onUploaded }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="bg-panel p-6">
        <h2 className="font-serif text-2xl font-medium text-text-primary mb-1">Upload music</h2>
        <p className="text-text-secondary text-sm">
          Import audio files into your library. They'll be stored securely and available on every page.
        </p>
      </section>
      <UploadZone onUpload={onUploaded} />
    </div>
  )
}
