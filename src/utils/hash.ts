/**
 * 极简字符串散列（cyrb53）。
 *
 * 仅用于前端演示：让 localStorage 里不出现明文密码，并保证同一密码每次散列结果一致。
 * 生产环境必须由后端使用 bcrypt / argon2 等带盐慢散列处理。
 */
export function hashString(input: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed

  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return combined.toString(16).padStart(14, '0')
}

/** 与固定盐值组合，避免相同密码产生相同散列。 */
export function hashPassword(password: string): string {
  return hashString(`portfolio::${password}::v1`)
}

/** 比较明文密码与已存散列。 */
export function verifyPassword(password: string, passwordHash: string): boolean {
  return hashPassword(password) === passwordHash
}
