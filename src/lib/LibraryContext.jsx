import { createContext, useContext } from 'react'
import { useLocalLibrary } from '../hooks/useLocalLibrary.js'

const LibraryContext = createContext(null)

export function LibraryProvider({ children }) {
  const library = useLocalLibrary()
  return <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const value = useContext(LibraryContext)
  if (!value) throw new Error('useLibrary must be used inside a LibraryProvider')
  return value
}
