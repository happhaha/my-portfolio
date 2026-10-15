/**
 * localStorage 封装。
 *
 * 所有键统一加 `portfolio:` 命名空间前缀，避免与宿主页面其它数据冲突。
 * 读写均做了容错：JSON 解析失败时回落到默认值并清理脏数据，
 * 隐私模式 / 存储配额不足时静默降级为内存 Map。
 */

const NAMESPACE = 'portfolio'

/** 数据结构版本号。改动种子数据形状时递增，触发一次重新播种。 */
export const SCHEMA_VERSION = 3

export const STORAGE_KEYS = {
  schemaVersion: `${NAMESPACE}:meta:schema-version`,
  session: `${NAMESPACE}:auth:session`,
  users: `${NAMESPACE}:auth:users`,
  profile: `${NAMESPACE}:content:profile`,
  skills: `${NAMESPACE}:content:skills`,
  projects: `${NAMESPACE}:content:projects`,
  posts: `${NAMESPACE}:content:posts`,
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** 内存兜底存储：当 localStorage 不可用（隐私模式、被禁用）时使用。 */
const memoryFallback = new Map<string, string>()

let persistentStorageAvailable: boolean | null = null

function resolveStorage(): Storage | null {
  if (persistentStorageAvailable === false) return null

  try {
    const probeKey = `${NAMESPACE}:__probe__`
    window.localStorage.setItem(probeKey, '1')
    window.localStorage.removeItem(probeKey)
    persistentStorageAvailable = true
    return window.localStorage
  } catch {
    persistentStorageAvailable = false
    console.warn('[storage] localStorage 不可用，已降级为内存存储（刷新后数据丢失）。')
    return null
  }
}

function getRaw(key: string): string | null {
  const storage = resolveStorage()
  if (!storage) return memoryFallback.get(key) ?? null
  return storage.getItem(key)
}

function setRaw(key: string, value: string): void {
  const storage = resolveStorage()
  if (!storage) {
    memoryFallback.set(key, value)
    return
  }
  try {
    storage.setItem(key, value)
  } catch (error) {
    console.warn(`[storage] 写入 ${key} 失败，已降级为内存存储。`, error)
    memoryFallback.set(key, value)
  }
}

/** 读取并反序列化。解析失败时返回 fallback 并清掉脏数据。 */
export function readJson<T>(key: StorageKey, fallback: T): T {
  const raw = getRaw(key)
  if (raw === null) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    console.warn(`[storage] ${key} 内容损坏，已重置。`)
    removeKey(key)
    return fallback
  }
}

/** 序列化写入。 */
export function writeJson<T>(key: StorageKey, value: T): T {
  setRaw(key, JSON.stringify(value))
  return value
}

export function removeKey(key: StorageKey): void {
  const storage = resolveStorage()
  memoryFallback.delete(key)
  storage?.removeItem(key)
}

/** 判断某个键是否已存在（用于首次播种检测）。 */
export function hasKey(key: StorageKey): boolean {
  return getRaw(key) !== null
}

/** 清空本应用写入的全部数据，用于「重置演示数据」。 */
export function clearAll(): void {
  Object.values(STORAGE_KEYS).forEach((key) => removeKey(key))
}

export function getSchemaVersion(): number | null {
  const raw = getRaw(STORAGE_KEYS.schemaVersion)
  if (raw === null) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function setSchemaVersion(version: number): void {
  setRaw(STORAGE_KEYS.schemaVersion, String(version))
}
