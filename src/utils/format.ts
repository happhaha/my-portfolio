/** 统一日期输出：2026-10-15 */
export function formatDate(value: string | number | Date): string {
  const date = toDate(value)
  if (!date) return '—'

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 统一日期时间输出：2026-10-15 20:37 */
export function formatDateTime(value: string | number | Date): string {
  const date = toDate(value)
  if (!date) return '—'

  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${formatDate(date)} ${hour}:${minute}`
}

/** 相对时间，超过 30 天直接显示日期。 */
export function formatRelative(value: string | number | Date): string {
  const date = toDate(value)
  if (!date) return '—'

  const diff = Date.now() - date.getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(date)
}

/** 以 300 字/分钟估算中文阅读时长，最少 1 分钟。 */
export function readingTime(content: string): string {
  const characters = content.replace(/\s+/g, '').length
  return `${Math.max(1, Math.round(characters / 300))} 分钟阅读`
}

/** 截断长文本，用于卡片摘要。 */
export function truncate(input: string, max = 120): string {
  const text = input.trim()
  return text.length <= max ? text : `${text.slice(0, max)}…`
}

/** 取两人首字母作为头像兜底文字。 */
export function initialsOf(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.slice(0, 2).toUpperCase()
}

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
