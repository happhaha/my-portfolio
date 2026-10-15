import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/components/ui'

/**
 * 滚动入场动画容器。
 *
 * 用 IntersectionObserver 在元素进入视口时加一次 fade-up，
 * 只触发一次，避免来回滚动反复播放。
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  /** 延迟（毫秒），用于让同组元素依次出现 */
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // 不支持 IntersectionObserver 的环境直接展示，保证内容可见
    if (typeof IntersectionObserver !== 'function') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-smooth',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
