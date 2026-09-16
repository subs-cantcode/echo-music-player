import { useState, useRef, useCallback } from 'react'

export function useAudioPlayer() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime)
      })
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration)
      })
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
      })
    }
    return audioRef.current
  }, [])

  const playTrack = useCallback(async (src) => {
    const audio = ensureAudio()
    audio.src = src
    try {
      await audio.play()
      setIsPlaying(true)
    } catch (err) {
      console.error('Playback error:', err)
      setIsPlaying(false)
    }
  }, [ensureAudio])

  const togglePlay = useCallback(async () => {
    const audio = ensureAudio()
    if (!audio.src) return
    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Playback error:', err)
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [ensureAudio])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const skip = useCallback((seconds) => {
    if (!audioRef.current || !duration) return
    const next = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
    audioRef.current.currentTime = next
    setCurrentTime(next)
  }, [duration])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    progress,
    playTrack,
    togglePlay,
    pause,
    seek,
    skip,
  }
}
