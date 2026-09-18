import { useState, useRef, useCallback, useEffect } from 'react'

export function useAudioPlayer({ onEnded } = {}) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [loopMode, setLoopMode] = useState('off') // 'off' | 'all' | 'track'

  // Keep the latest callback in a ref so the audio element is only wired once.
  const onEndedRef = useRef(onEnded)
  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  // Same for the loop mode: the audio element is wired once, so read it via a ref.
  const loopModeRef = useRef(loopMode)
  useEffect(() => {
    loopModeRef.current = loopMode
    if (audioRef.current) audioRef.current.loop = loopMode === 'track'
  }, [loopMode])

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.loop = loopModeRef.current === 'track'
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime)
      })
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration)
      })
      audioRef.current.addEventListener('ended', () => {
        const played = audioRef.current.currentTime
        setIsPlaying(false)
        if (onEndedRef.current) onEndedRef.current(played, loopModeRef.current)
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

  const setVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(1, val))
    setVolumeState(clamped)
    setIsMuted(clamped === 0)
    if (audioRef.current) {
      audioRef.current.volume = clamped
      audioRef.current.muted = clamped === 0
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      audioRef.current.muted = newMuted
    }
  }, [isMuted])

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

  // Loop toggle (three-state cycle: off → all → track → off)
  const toggleLoop = useCallback(() => {
    setLoopMode((prev) => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'track'
      return 'off'
    })
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    loopMode,
    playTrack,
    togglePlay,
    pause,
    seek,
    skip,
    setVolume,
    toggleMute,
    toggleLoop,
  }
}
