/**
 * 登录态上下文。
 *
 * - 初始状态同步读取 localStorage，因此首屏不会出现「已登录却闪一下登录页」。
 * - 监听 storage 事件，多个标签页之间登录/退出会互相同步。
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import * as api from '@/api'
import { toErrorMessage } from '@/api/client'
import type { Session } from '@/types'
import { STORAGE_KEYS } from '@/utils/storage'

export interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  /** 正在提交登录请求 */
  signingIn: boolean
  /** 登录失败原因，展示在登录表单上 */
  error: string | null
  signIn: (username: string, password: string) => Promise<Session>
  signOut: () => void
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => api.getSession())
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(async (username: string, password: string) => {
    setSigningIn(true)
    setError(null)

    try {
      const nextSession = await api.login(username, password)
      setSession(nextSession)
      return nextSession
    } catch (caught) {
      const message = toErrorMessage(caught)
      setError(message)
      throw caught
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signOut = useCallback(() => {
    api.logout()
    setSession(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // 跨标签页同步：其它标签页登录/退出时刷新本地状态
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEYS.session) return
      setSession(api.getSession())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // 会话过期时静默登出（切回标签页时校验一次）
  useEffect(() => {
    const verify = () => {
      if (session && !api.getSession()) setSession(null)
    }

    document.addEventListener('visibilitychange', verify)
    return () => document.removeEventListener('visibilitychange', verify)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      signingIn,
      error,
      signIn,
      signOut,
      clearError,
    }),
    [session, signingIn, error, signIn, signOut, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
