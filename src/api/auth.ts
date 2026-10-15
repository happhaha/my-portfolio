/**
 * 鉴权 API（模拟后端）。
 *
 * 会话写入 localStorage 的 `portfolio:auth:session`，带过期时间（默认 7 天）。
 * getSession() 是同步的，供路由守卫在渲染前直接判断。
 */

import { ApiError, assert, request, throwUnauthorized } from '@/api/client'
import { readUsers, writeUsers } from '@/api/db'
import type { Session, User } from '@/types'
import { hashPassword, verifyPassword } from '@/utils/hash'
import { createId, createToken } from '@/utils/id'
import { STORAGE_KEYS, readJson, removeKey, writeJson } from '@/utils/storage'

/** 会话有效期：7 天。 */
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

/** 同步读取当前会话；已过期会自动清理并返回 null。 */
export function getSession(): Session | null {
  const session = readJson<Session | null>(STORAGE_KEYS.session, null)

  if (!session || typeof session.token !== 'string') return null

  if (session.expiresAt <= Date.now()) {
    removeKey(STORAGE_KEYS.session)
    return null
  }

  return session
}

function persistSession(session: Session): Session {
  return writeJson(STORAGE_KEYS.session, session)
}

function findUserByUsername(username: string): User | undefined {
  const normalized = username.trim().toLowerCase()
  return readUsers().find((user) => user.username.toLowerCase() === normalized)
}

function createSessionFor(user: User): Session {
  const issuedAt = Date.now()
  return persistSession({
    token: createToken(),
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL,
  })
}

/**
 * 登录。参数为空抛 400，凭据错误抛 401。
 */
export async function login(username: string, password: string): Promise<Session> {
  return request(
    () => {
      assert(username.trim().length > 0, '请输入用户名')
      assert(password.length > 0, '请输入密码')

      const user = findUserByUsername(username)
      if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new ApiError('用户名或密码错误', 401, 'INVALID_CREDENTIALS')
      }

      return createSessionFor(user)
    },
    { label: 'auth.login' },
  )
}

/** 退出登录，清空会话。 */
export function logout(): void {
  removeKey(STORAGE_KEYS.session)
}

/** 根据当前会话取回账号信息（不含密码散列）。未登录抛 401。 */
export async function fetchCurrentUser(): Promise<Omit<User, 'passwordHash'>> {
  return request(
    () => {
      const session = getSession()
      if (!session) throwUnauthorized()

      const user = readUsers().find((item) => item.id === session.userId)
      if (!user) throwUnauthorized('账号不存在，请重新登录')

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
      }
    },
    { label: 'auth.me' },
  )
}

/** 修改密码。需要提供当前密码。 */
export async function changePassword(
  currentPassword: string,
  nextPassword: string,
): Promise<{ ok: true }> {
  return request(
    () => {
      const session = getSession()
      if (!session) throwUnauthorized()

      assert(nextPassword.length >= 6, '新密码至少 6 位')

      const users = readUsers()
      const index = users.findIndex((item) => item.id === session.userId)
      if (index === -1) throwUnauthorized('账号不存在，请重新登录')

      const user = users[index]
      if (!verifyPassword(currentPassword, user.passwordHash)) {
        throw new ApiError('当前密码不正确', 400, 'INVALID_PASSWORD')
      }

      users[index] = { ...user, passwordHash: hashPassword(nextPassword) }
      writeUsers(users)

      return { ok: true } as const
    },
    { label: 'auth.changePassword' },
  )
}

/** 注册新账号（演示用，界面未开放入口）。 */
export async function register(
  username: string,
  password: string,
  displayName?: string,
): Promise<Session> {
  return request(
    () => {
      assert(username.trim().length >= 3, '用户名至少 3 位')
      assert(password.length >= 6, '密码至少 6 位')

      const users = readUsers()
      if (users.some((user) => user.username.toLowerCase() === username.trim().toLowerCase())) {
        throw new ApiError('用户名已存在', 409, 'USERNAME_TAKEN')
      }

      const user: User = {
        id: createId('user'),
        username: username.trim(),
        displayName: displayName?.trim() || username.trim(),
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      }

      writeUsers([...users, user])
      return createSessionFor(user)
    },
    { label: 'auth.register' },
  )
}
