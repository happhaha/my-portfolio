/** 生成带前缀的唯一 ID，例如 `proj_lz3k9f2a`。 */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  const stamp = Date.now().toString(36)
  return `${prefix}_${stamp}${random}`
}

/** 生成不透明的会话令牌。 */
export function createToken(): string {
  const bytes = new Uint8Array(16)

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** 把标题转成 URL 友好的 slug，中文标题会回落到时间戳后缀。 */
export function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!ascii) return `post-${Date.now().toString(36)}`
  return /[\u4e00-\u9fa5]/.test(ascii) ? `${ascii}-${Date.now().toString(36).slice(-4)}` : ascii
}
