import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from '@/context/AuthContext'

/**
 * 读取登录态。必须在 <AuthProvider> 内使用。
 *
 * @example
 * const { session, signIn, signOut } = useAuth()
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth 必须在 <AuthProvider> 内部使用')
  }

  return context
}
