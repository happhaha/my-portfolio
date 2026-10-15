/**
 * 数据表读写 + 首次播种。
 *
 * 每个「表」对应一个 localStorage 键；db 只负责最原始的整表读写，
 * 业务规则都在各 api 模块里。
 */

import { seedPosts, seedProfile, seedProjects, seedSkills, seedUsers } from '@/data/seed'
import type { Post, Profile, Project, Skill, User } from '@/types'
import {
  SCHEMA_VERSION,
  STORAGE_KEYS,
  clearAll,
  getSchemaVersion,
  hasKey,
  readJson,
  setSchemaVersion,
  writeJson,
} from '@/utils/storage'

export function readUsers(): User[] {
  return readJson<User[]>(STORAGE_KEYS.users, [])
}

export function writeUsers(users: User[]): User[] {
  return writeJson(STORAGE_KEYS.users, users)
}

export function readSkills(): Skill[] {
  return readJson<Skill[]>(STORAGE_KEYS.skills, [])
}

export function writeSkills(skills: Skill[]): Skill[] {
  return writeJson(STORAGE_KEYS.skills, skills)
}

export function readProjects(): Project[] {
  return readJson<Project[]>(STORAGE_KEYS.projects, [])
}

export function writeProjects(projects: Project[]): Project[] {
  return writeJson(STORAGE_KEYS.projects, projects)
}

export function readPosts(): Post[] {
  return readJson<Post[]>(STORAGE_KEYS.posts, [])
}

export function writePosts(posts: Post[]): Post[] {
  return writeJson(STORAGE_KEYS.posts, posts)
}

/** profile 是个对象而非数组，单独处理。 */
export function readProfileTable(): Profile {
  return readJson<Profile>(STORAGE_KEYS.profile, seedProfile())
}

export function writeProfileTable(profile: Profile): Profile {
  return writeJson(STORAGE_KEYS.profile, profile)
}

/** 写入全套种子数据。 */
export function seedAll(): void {
  writeUsers(seedUsers())
  writeProfileTable(seedProfile())
  writeSkills(seedSkills())
  writeProjects(seedProjects())
  writePosts(seedPosts())
  setSchemaVersion(SCHEMA_VERSION)
}

/**
 * 应用启动时调用一次。
 * - 数据不存在 → 播种
 * - 版本号落后 → 清空重播（演示项目，不做迁移）
 */
export function ensureSeeded(): { seeded: boolean; version: number } {
  const version = getSchemaVersion()
  const isFresh = !hasKey(STORAGE_KEYS.profile) || !hasKey(STORAGE_KEYS.users)

  if (isFresh || version !== SCHEMA_VERSION) {
    if (!isFresh) {
      console.info(`[db] 数据结构版本由 v${version ?? 'unknown'} 升级到 v${SCHEMA_VERSION}，重新播种演示数据。`)
    }
    clearAll()
    seedAll()
    return { seeded: true, version: SCHEMA_VERSION }
  }

  return { seeded: false, version: SCHEMA_VERSION }
}

/**
 * 重置为初始演示数据（后台「恢复演示数据」按钮使用）。
 *
 * 只覆盖内容表，不动 `portfolio:auth:session`：
 * 重置数据属于内容操作，不应把正在操作的人直接踢下线。
 */
export function resetToSeed(): void {
  seedAll()
}
