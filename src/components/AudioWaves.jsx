import { useEffect, useRef } from 'react'
import { getAudioLevel } from '../lib/audioAnalysis.js'
import './AudioWaves.css'

// Matches --accent in src/index.css for each theme, mirroring ParticleBackground.
const WAVE_COLOR = {
  light: '196, 138, 42',
  dark: '217, 162, 60',
}

const WAVE_COUNT = 5
// Baseline opacity and the extra paid in at full level.
const BASE_ALPHA = 0.3
const ENERGY_ALPHA = 0.4
// How far the stack spreads from the centre line: a calm band at rest that
// swells with the music, always kept inside the canvas.
const BASE_SPREAD = 0.35
const ENERGY_SPREAD = 0.65

/**
 * Ambient sine waves behind the player bar. Draws against the shared audio tap
 * (getAudioLevel) rather than its own AudioContext: the element is already
 * routed through an AnalyserNode, and a second createMediaElementSource would
 * throw.
 */
export const AudioWaves = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Echo's theme lives on the <html> element as a `dark` class.
    const isDarkMode = () => document.documentElement.classList.contains('dark')

    let width = 0
    let height = 0

    const resize = () => {
      const nextWidth = canvas.offsetWidth
      const nextHeight = canvas.offsetHeight
      if (!nextWidth || !nextHeight) return

      width = nextWidth
      height = nextHeight

      // Match the bitmap to the CSS box (and device pixel ratio) so the browser
      // never scales or stretches the drawing.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()

    // Watch the element, not just the window: the bar's box also changes with
    // layout (sidebar collapse, viewport width) without a resize event.
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(canvas)
    window.addEventListener('resize', resize)

    let animationId
    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // 0 when idle or untappable, so the waves rest calm instead of stopping.
      const energy = getAudioLevel()
      const rgb = isDarkMode() ? WAVE_COLOR.dark : WAVE_COLOR.light

      ctx.strokeStyle = `rgb(${rgb})`
      ctx.globalAlpha = BASE_ALPHA + energy * ENERGY_ALPHA
      ctx.lineWidth = 2

      const center = height / 2
      const spread = center * (BASE_SPREAD + energy * ENERGY_SPREAD)
      const frequency = 0.01 + energy * 0.01
      const phase = Date.now() * 0.001

      for (let i = 0; i < WAVE_COUNT; i += 1) {
        const amplitude = spread * ((i + 1) / (WAVE_COUNT + 1))

        ctx.beginPath()
        for (let x = 0; x <= width; x += 1) {
          const y = center + Math.sin(x * frequency + phase + i * 0.5) * amplitude
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      observer?.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="audio-waves" aria-hidden="true" />
}

export default AudioWaves
