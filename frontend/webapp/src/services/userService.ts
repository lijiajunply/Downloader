import type { UserChangePasswordDto, UserCreateDto, UserDto, UserUpdateDto } from '@/types'
import { apiRequest } from './http'

const userPath = '/api/User'

export function getUserList(token?: string) {
  return apiRequest<UserDto[]>(userPath, { token })
}

export function getUser(id: string, token?: string) {
  return apiRequest<UserDto>(`${userPath}/${encodeURIComponent(id)}`, { token })
}

export function createUser(dto: UserCreateDto, token?: string) {
  return apiRequest<UserDto>(userPath, {
    method: 'POST',
    body: dto,
    token,
  })
}

export function updateUser(id: string, dto: UserUpdateDto, token?: string) {
  return apiRequest<void>(`${userPath}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dto,
    token,
  })
}

export function resetUserPassword(id: string, dto: UserChangePasswordDto, token?: string) {
  return apiRequest<void>(`${userPath}/${encodeURIComponent(id)}/reset-password`, {
    method: 'PUT',
    body: dto,
    token,
  })
}

export function deleteUser(id: string, token?: string) {
  return apiRequest<void>(`${userPath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
