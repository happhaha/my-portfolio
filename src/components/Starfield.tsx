import { useEffect, useRef } from 'react'

/**
 * Canvas 星空背景。
 *
 * 实现要点：
 * - 星星数量按 `面积 × density` 计算，小屏不空、大屏不过载
 * - 每颗星有独立相位 / 周期，透明度按正弦变化形成自然闪烁
 * - 支持 devicePixelRatio（上限 2），高分屏不发虚
 * - 鼠标移动产生轻微视差，滚动时星点缓慢漂移
 * - 随机流星；遵循 prefers-reduced-motion 时只绘制一帧静态星空
 */

interface Star {
  /** 归一化坐标（0-1），与视口尺寸解耦，resize 时无需重建 */
  x: number
  y: number
  /** 深度：0 远 ~ 1 近，影响半径、亮度和视差强度 */
  depth: number
  radius: number
  baseAlpha: number
  twinkleSpeed: number
  phase: number
  /** 部分星星带一点冷色调，避免整片纯白显得单调 */
  hue: number
}

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  length: number
  width: number
}

export interface StarfieldProps {
  /** 星星密度（个 / CSS 像素²）。默认 0.00016，1080p 下约 330 颗。 */
  density?: number
  /** 是否启用鼠标视差 */
  parallax?: boolean
  /** 是否出现流星 */
  meteors?: boolean
  /** 滚动漂移速度倍率（0 表示不随滚动移动） */
  scrollFactor?: number
  className?: string
}

const MIN_STARS = 90
const MAX_STARS = 520

export default function Starfield({
  density = 0.00016,
  parallax = true,
  meteors = true,
  scrollFactor = 0.35,
  className = '',
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1
    let stars: Star[] = []
    let meteorList: Meteor[] = []
    let animationFrame = 0
    let lastTimestamp = performance.now()
    let elapsed = 0
    let nextMeteorAt = 1200

    // 鼠标视差：目标值与当前值分离，做插值让移动更柔和
    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 }
    let scrollOffset = 0

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

    const createStars = (count: number): Star[] =>
      Array.from({ length: count }, () => {
        const depth = Math.random()
        return {
          x: Math.random(),
          y: Math.random(),
          depth,
          radius: 0.35 + depth * 1.15,
          baseAlpha: 0.25 + depth * 0.6,
          twinkleSpeed: randomBetween(0.35, 1.5),
          phase: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.3 ? randomBetween(190, 230) : 0,
        }
      })

    const spawnMeteor = () => {
      const startX = randomBetween(0.1, 1.05)
      const startY = randomBetween(-0.1, 0.35)
      const speed = randomBetween(0.22, 0.4)

      return {
        x: startX,
        y: startY,
        vx: -speed * randomBetween(0.7, 1.1),
        vy: speed,
        life: 0,
        maxLife: randomBetween(0.9, 1.5),
        length: randomBetween(0.05, 0.12),
        width: randomBetween(1, 1.8),
      } satisfies Meteor
    }

    /** 尺寸变化时重建缓冲区与星点分布（只改数量，不改已有随机种子统一性） */
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const desired = Math.round(width * height * density)
      const count = Math.max(MIN_STARS, Math.min(MAX_STARS, desired))

      if (stars.length === 0) {
        stars = createStars(count)
        return
      }

      if (Math.abs(stars.length - count) > count * 0.25) {
        const kept = stars.slice(0, Math.min(stars.length, count))
        const appended = kept.length < count ? createStars(count - kept.length) : []
        stars = [...kept, ...appended]
      }
    }

    const drawNebula = () => {
      // 两团极淡的星云，给纯黑背景一点色彩层次
      const gradientA = context.createRadialGradient(
        width * 0.22,
        height * 0.12,
        0,
        width * 0.22,
        height * 0.12,
        Math.max(width, height) * 0.55,
      )
      gradientA.addColorStop(0, 'rgba(58, 164, 255, 0.085)')
      gradientA.addColorStop(1, 'rgba(58, 164, 255, 0)')
      context.fillStyle = gradientA
      context.fillRect(0, 0, width, height)

      const gradientB = context.createRadialGradient(
        width * 0.85,
        height * 0.75,
        0,
        width * 0.85,
        height * 0.75,
        Math.max(width, height) * 0.5,
      )
      gradientB.addColorStop(0, 'rgba(139, 92, 246, 0.09)')
      gradientB.addColorStop(1, 'rgba(139, 92, 246, 0)')
      context.fillStyle = gradientB
      context.fillRect(0, 0, width, height)
    }

    const drawStars = (time: number) => {
      const parallaxX = pointer.x * 18
      const parallaxY = pointer.y * 14

      for (const star of stars) {
        const twinkle = 0.62 + 0.38 * Math.sin(star.phase + time * star.twinkleSpeed)
        const alpha = Math.min(1, star.baseAlpha * twinkle)

        // 近处的星星位移更大，形成视差
        const offsetX = parallaxX * star.depth + Math.sin(star.phase) * 1.5
        const driftY = ((star.y * height - scrollOffset * star.depth * scrollFactor) % (height + 40) + height + 40) % (height + 40)
        const y = driftY + parallaxY * star.depth - 20

        const x = star.x * width + offsetX
        const radius = star.radius

        context.beginPath()
        context.fillStyle =
          star.hue === 0 ? `rgba(255, 255, 255, ${alpha})` : `hsla(${star.hue}, 90%, 82%, ${alpha})`
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()

        // 最亮的少数星星加一圈柔光，模拟大气的光晕
        if (radius > 1.1 && alpha > 0.55) {
          context.beginPath()
          context.fillStyle = `rgba(150, 200, 255, ${alpha * 0.14})`
          context.arc(x, y, radius * 4.5, 0, Math.PI * 2)
          context.fill()
        }
      }
    }

    const drawMeteors = (delta: number) => {
      for (const meteor of meteorList) {
        meteor.life += delta
        meteor.x += meteor.vx * delta
        meteor.y += meteor.vy * delta
      }

      meteorList = meteorList.filter(
        (meteor) => meteor.life < meteor.maxLife && meteor.y < 1.4 && meteor.x > -0.4,
      )

      for (const meteor of meteorList) {
        const progress = meteor.life / meteor.maxLife
        const alpha = Math.sin(Math.PI * progress) * 0.85

        const startX = meteor.x * width
        const startY = meteor.y * height
        const endX = (meteor.x - meteor.vx * meteor.length * 12) * width
        const endY = (meteor.y - meteor.vy * meteor.length * 12) * height

        const trail = context.createLinearGradient(startX, startY, endX, endY)
        trail.addColorStop(0, `rgba(214, 236, 255, ${alpha})`)
        trail.addColorStop(0.45, `rgba(150, 200, 255, ${alpha * 0.35})`)
        trail.addColorStop(1, 'rgba(150, 200, 255, 0)')

        context.strokeStyle = trail
        context.lineWidth = meteor.width
        context.lineCap = 'round'
        context.beginPath()
        context.moveTo(startX, startY)
        context.lineTo(endX, endY)
        context.stroke()
      }
    }

    const renderFrame = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
      lastTimestamp = timestamp
      elapsed += delta

      // 鼠标插值，消除抖动
      pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 4)
      pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 4)

      context.clearRect(0, 0, width, height)
      drawNebula()
      drawStars(elapsed)

      if (meteors) {
        nextMeteorAt -= delta * 1000
        if (nextMeteorAt <= 0) {
          meteorList.push(spawnMeteor())
          nextMeteorAt = randomBetween(4200, 11000)
        }
        drawMeteors(delta)
      }
    }

    const loop = (timestamp: number) => {
      renderFrame(timestamp)
      animationFrame = window.requestAnimationFrame(loop)
    }

    const renderStatic = () => {
      context.clearRect(0, 0, width, height)
      drawNebula()
      drawStars(0)
    }

    const readScroll = () => {
      scrollOffset = window.scrollY || document.documentElement.scrollTop || 0
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!parallax) return
      pointer.targetX = (event.clientX / width - 0.5) * 2
      pointer.targetY = (event.clientY / height - 0.5) * 2
    }

    const handlePointerLeave = () => {
      pointer.targetX = 0
      pointer.targetY = 0
    }

    resize()
    readScroll()

    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null
    resizeObserver?.observe(canvas)

    if (parallax) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      window.addEventListener('pointerleave', handlePointerLeave)
    }

    if (scrollFactor !== 0) {
      window.addEventListener('scroll', readScroll, { passive: true })
    }

    if (prefersReducedMotion) {
      renderStatic()
    } else {
      lastTimestamp = performance.now()
      animationFrame = window.requestAnimationFrame(loop)
    }

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', readScroll)
    }
  }, [density, parallax, meteors, scrollFactor])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-night-950 ${className}`}
    >
      {/* 底层渐变：即使 Canvas 未渲染完成也不会露出白底 */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#0d1a33_0%,#070b16_45%,#04060d_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* 顶部微光 + 网格，增强「深空 + 工程感」的层次 */}
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora-400/40 to-transparent" />
    </div>
  )
}
