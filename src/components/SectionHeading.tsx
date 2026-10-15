import type { ReactNode } from 'react'

import { cn } from '@/components/ui'

/** 区块标题：小标签 + 主标题 + 描述。 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
  id,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  action?: ReactNode
  className?: string
  id?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('space-y-2', align === 'center' && 'mx-auto max-w-2xl')}>
        {eyebrow ? (
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-aurora-300">
            {align === 'center' ? null : <span className="h-px w-8 bg-aurora-400/60" />}
            {eyebrow}
          </p>
        ) : null}
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-night-300">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
