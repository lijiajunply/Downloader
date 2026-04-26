import { createContext } from 'react'
import type { UserDto, UserLoginDto } from '@/types'

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  token: string | null
  user: UserDto | null
  login: (dto: UserLoginDto) => Promise<UserDto>
  logout: () => void
  refreshMe: () => Promise<UserDto | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
