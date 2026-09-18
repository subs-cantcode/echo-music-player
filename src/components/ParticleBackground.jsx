import { useEffect, useRef } from 'react'
import './ParticleBackground.css'

export const ParticleBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system
    const particles = []
    const particleCount = 30

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 60 + 20
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.15 + 0.05
        this.life = Math.random() * 0.5 + 0.5
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life -= 0.0005

        // Wrap around edges
        if (this.x + this.size < 0) this.x = canvas.width + this.size
        if (this.x - this.size > canvas.width) this.x = -this.size
        if (this.y + this.size < 0) this.y = canvas.height + this.size
        if (this.y - this.size > canvas.height) this.y = -this.size
      }

      draw(ctx, isDark) {
        const color = isDark ? 'rgba(217, 162, 60,' : 'rgba(196, 138, 42,'
        ctx.fillStyle = `${color} ${this.opacity * this.life})`

        // Soft blob shape
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    // Echo's theme lives on the <html> element as a `dark` class.
    const isDarkMode = () => document.documentElement.classList.contains('dark')

    // Animation loop
    const animate = () => {
      // Clear canvas (with slight fade for trail effect)
      ctx.fillStyle = isDarkMode() ? 'rgba(22, 20, 18, 0.05)' : 'rgba(248, 246, 241, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((p, index) => {
        p.update()
        p.draw(ctx, isDarkMode())

        // Respawn dead particles
        if (p.life <= 0) {
          particles[index] = new Particle()
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="particle-background" />
}

export default ParticleBackground
