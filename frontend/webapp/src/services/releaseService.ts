import type { ReleaseCreateDto, ReleaseDto, ReleaseUpdateDto } from '@/types'
import { apiRequest } from './http'

const releasePath = '/api/Release'

export function getReleaseList() {
  return apiRequest<ReleaseDto[]>(releasePath)
}

export function getRelease(id: string) {
  return apiRequest<ReleaseDto>(`${releasePath}/${encodeURIComponent(id)}`)
}

export function createRelease(dto: ReleaseCreateDto, token?: string) {
  return apiRequest<ReleaseDto>(releasePath, {
    method: 'POST',
    body: dto,
    token,
  })
}

export function updateRelease(id: string, dto: ReleaseUpdateDto, token?: string) {
  return apiRequest<void>(`${releasePath}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dto,
    token,
  })
}

export function deleteRelease(id: string, token?: string) {
  return apiRequest<void>(`${releasePath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
