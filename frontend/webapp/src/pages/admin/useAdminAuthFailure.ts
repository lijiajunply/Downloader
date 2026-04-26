import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { isUnauthorizedError } from './adminUtils'

export function useAdminAuthFailure() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return useCallback(
    (error: unknown) => {
      if (isUnauthorizedError(error)) {
        logout()
        navigate('/login', { replace: true })
        return true
      }

      return false
    },
    [logout, navigate],
  )
}
