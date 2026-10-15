/**
 * 通用 UI 原子组件。
 *
 * 全部保持无状态、可用 className 覆盖样式，方便在不同页面复用。
 */

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

/* ------------------------------------------------------------------ */
/* 基础工具                                                            */
/* ------------------------------------------------------------------ */

type ClassValue = string | false | null | undefined

/** 简易 className 合并，过滤假值。 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ */
/* 按钮                                                                */
/* ------------------------------------------------------------------ */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-aurora-500 text-white shadow-glow hover:bg-aurora-400 focus-visible:outline-aurora-300 disabled:hover:bg-aurora-500',
  secondary:
    'border border-night-600 bg-night-800/70 text-night-100 hover:border-aurora-400/60 hover:bg-night-700/70',
  ghost: 'text-night-300 hover:bg-night-700/50 hover:text-night-100',
  danger: 'border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 展示加载态并自动禁用 */
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-smooth',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-55',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* 表单控件                                                            */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  'w-full rounded-lg border border-night-600 bg-night-900/70 px-3 py-2 text-sm text-night-100 placeholder:text-night-400 transition-colors duration-200 focus:border-aurora-400 focus:outline-none focus:ring-2 focus:ring-aurora-500/25 disabled:opacity-60'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, 'h-10', className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD_BASE, 'min-h-[96px] resize-y leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD_BASE, 'h-10 cursor-pointer', className)} {...rest}>
      {children}
    </select>
  )
}

export interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

/** 表单行：标签 + 控件 + 提示 / 错误。 */
export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-xs font-medium text-night-200">
        {label}
        {required ? <span className="text-rose-300">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-xs text-night-400">{hint}</p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 展示组件                                                            */
/* ------------------------------------------------------------------ */

export type BadgeTone = 'default' | 'aurora' | 'violet' | 'success' | 'warning' | 'danger'

const BADGE_TONES: Record<BadgeTone, string> = {
  default: 'border-night-600 bg-night-800/70 text-night-200',
  aurora: 'border-aurora-400/40 bg-aurora-500/12 text-aurora-200',
  violet: 'border-plasma-400/40 bg-plasma-500/12 text-plasma-300',
  success: 'border-emerald-400/40 bg-emerald-500/12 text-emerald-200',
  warning: 'border-amber-400/40 bg-amber-500/12 text-amber-200',
  danger: 'border-rose-400/40 bg-rose-500/12 text-rose-200',
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-night-700/70 bg-night-900/60 p-5 shadow-panel backdrop-blur-sm',
        interactive &&
          'transition-all duration-300 ease-smooth hover:-translate-y-1 hover:border-aurora-400/50 hover:bg-night-850/70 hover:shadow-glow',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="加载中"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        className ?? 'h-5 w-5',
      )}
    />
  )
}

/** 加载占位骨架。 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-night-800 via-night-700 to-night-800',
        className,
      )}
    />
  )
}

/** 空状态。 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-12 text-center',
        className,
      )}
    >
      <p className="text-sm font-medium text-night-100">{title}</p>
      {description ? <p className="max-w-md text-xs text-night-400">{description}</p> : null}
      {action}
    </div>
  )
}

/** 错误提示条。 */
export function ErrorNotice({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200',
        className,
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </div>
  )
}

/** 轻量开关。 */
export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  id?: string
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2 text-sm text-night-200">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-aurora-400 bg-aurora-500/80' : 'border-night-600 bg-night-800',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ease-smooth',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
      {label}
    </label>
  )
}
