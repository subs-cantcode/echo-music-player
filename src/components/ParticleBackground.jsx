import { useEffect, useRef } from 'react'
import './ParticleBackground.css'

// Matches --accent in src/index.css for each theme.
const PARTICLE_COLOR = {
  light: '196, 138, 42',
  dark: '217, 162, 60',
}

// The dark accent sits at roughly 8:1 contrast on the dark surface but the
// light accent only reaches ~2.8:1 on the light surface, so the glow is toned
// down in dark mode to keep both themes looking equally soft.
const PARTICLE_ALPHA = {
  light: [0.07, 0.18],
  dark: [0.04, 0.11],
}

const SPRITE_SIZE = 128
const AREA_PER_PARTICLE = 55000
const MIN_PARTICLES = 8
const MAX_PARTICLES = 18

// A soft radial blob, drawn once per theme and scaled per particle.
function createGlowSprite(rgb) {
  const sprite = document.createElement('canvas')
  sprite.width = SPRITE_SIZE
  sprite.height = SPRITE_SIZE

  const ctx = sprite.getContext('2d')
  const center = SPRITE_SIZE / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, `rgba(${rgb}, 1)`)
  gradient.addColorStop(0.5, `rgba(${rgb}, 0.35)`)
  gradient.addColorStop(1, `rgba(${rgb}, 0)`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
  return sprite
}

export const ParticleBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const sprites = {
      light: createGlowSprite(PARTICLE_COLOR.light),
      dark: createGlowSprite(PARTICLE_COLOR.dark),
    }

    // Echo's theme lives on the <html> element as a `dark` class.
    const isDarkMode = () => document.documentElement.classList.contains('dark')

    const particles = []
    let width = 0
    let height = 0

    const createParticle = () => {
      // Blobs are sized against the page column so they never crowd it.
      const scale = Math.min(Math.max(width / 680, 0.6), 1.4)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: (20 + Math.random() * 40) * scale,
        speedX: (Math.random() - 0.5) * 0.22,
        speedY: (Math.random() - 0.5) * 0.22,
        strength: Math.random() * 0.6 + 0.4,
      }
    }

    const resize = () => {
      const nextWidth = canvas.offsetWidth
      const nextHeight = canvas.offsetHeight
      if (!nextWidth || !nextHeight) return

      const previousWidth = width
      const previousHeight = height
      width = nextWidth
      height = nextHeight

      // Match the bitmap to the CSS box (and device pixel ratio) so the browser
      // never scales or stretches the drawing.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(
        MAX_PARTICLES,
        Math.max(MIN_PARTICLES, Math.round((width * height) / AREA_PER_PARTICLE))
      )
      if (particles.length > count) particles.length = count

      // Keep the field looking still while the sidebar animates.
      if (previousWidth && previousHeight) {
        const ratioX = width / previousWidth
        const ratioY = height / previousHeight
        particles.forEach((particle) => {
          particle.x *= ratioX
          particle.y *= ratioY
        })
      }

      while (particles.length < count) particles.push(createParticle())
    }

    resize()

    // Layout changes (sidebar collapse, route swap) resize the column without a
    // window resize event, so watch the element itself.
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(canvas)
    window.addEventListener('resize', resize)

    let animationId
    const animate = () => {
      // Cleared every frame: translucent fills would otherwise pile up into
      // smeared trails instead of floating blobs.
      ctx.clearRect(0, 0, width, height)

      const dark = isDarkMode()
      const [minAlpha, maxAlpha] = dark ? PARTICLE_ALPHA.dark : PARTICLE_ALPHA.light
      const sprite = dark ? sprites.dark : sprites.light

      for (const particle of particles) {
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Wrap around edges
        if (particle.x + particle.radius < 0) particle.x = width + particle.radius
        if (particle.x - particle.radius > width) particle.x = -particle.radius
        if (particle.y + particle.radius < 0) particle.y = height + particle.radius
        if (particle.y - particle.radius > height) particle.y = -particle.radius

        ctx.globalAlpha = minAlpha + (maxAlpha - minAlpha) * particle.strength
        const diameter = particle.radius * 2
        ctx.drawImage(
          sprite,
          particle.x - particle.radius,
          particle.y - particle.radius,
          diameter,
          diameter
        )
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

  return <canvas ref={canvasRef} className="particle-background" />
}

export default ParticleBackground
