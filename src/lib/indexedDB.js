const DB_NAME = 'echo-local'
const DB_VERSION = 1

let dbPromise = null

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('tracks')) {
        const tracks = db.createObjectStore('tracks', { keyPath: 'id' })
        tracks.createIndex('dateAdded', 'dateAdded', { unique: false })
        tracks.createIndex('lastPlayed', 'lastPlayed', { unique: false })
        tracks.createIndex('playCount', 'playCount', { unique: false })
      }

      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' })
      }
    }
  })

export const initDB = async () => {
  if (!dbPromise) dbPromise = openDatabase()
  return dbPromise
}

export const getDB = async () => {
  if (!dbPromise) dbPromise = openDatabase()
  return dbPromise
}
