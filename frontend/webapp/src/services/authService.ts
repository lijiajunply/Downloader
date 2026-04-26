import type { LoginResultDto, UserDto, UserLoginDto } from '@/types'
import { apiRequest } from './http'

const authPath = '/api/Auth'

export function login(dto: UserLoginDto) {
  return apiRequest<LoginResultDto>(`${authPath}/login`, {
    method: 'POST',
    body: dto,
  })
}

export function getMe(token?: string) {
  return apiRequest<UserDto>(`${authPath}/me`, { token })
}
