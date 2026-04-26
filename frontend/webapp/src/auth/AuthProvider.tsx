import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as loginRequest } from '@/services'
import type { UserDto, UserLoginDto } from '@/types'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authState'

const tokenStorageKey = 'downloader-auth-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenStorageKey))
  const [user, setUser] = useState<UserDto | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(tokenStorageKey) ? 'checking' : 'unauthenticated',
  )

  const clearAuth = useCallback(() => {
    localStorage.removeItem(tokenStorageKey)
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const refreshMe = useCallback(async () => {
    const currentToken = token

    if (!currentToken) {
      clearAuth()
      return null
    }

    try {
      const currentUser = await getMe(currentToken)
      setUser(currentUser)
      setStatus('authenticated')
      return currentUser
    } catch {
      clearAuth()
      return null
    }
  }, [clearAuth, token])

  useEffect(() => {
    const currentToken = token

    if (!currentToken) return

    let ignore = false

    async function restoreSession(sessionToken: string) {
      setStatus('checking')

      try {
        const currentUser = await getMe(sessionToken)
        if (ignore) return
        setUser(currentUser)
        setStatus('authenticated')
      } catch {
        if (ignore) return
        clearAuth()
      }
    }

    void restoreSession(currentToken)

    return () => {
      ignore = true
    }
  }, [clearAuth, token])

  const login = useCallback(async (dto: UserLoginDto) => {
    const result = await loginRequest(dto)
    localStorage.setItem(tokenStorageKey, result.token)
    setToken(result.token)
    setUser(result.user)
    setStatus('authenticated')
    return result.user
  }, [])

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      login,
      logout,
      refreshMe,
    }),
    [login, logout, refreshMe, status, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
