import type { SoftCreateDto, SoftDto, SoftUpdateDto } from '@/types'
import { apiRequest } from './http'

const softPath = '/api/Soft'

export function getSoftList() {
  return apiRequest<SoftDto[]>(softPath)
}

export function getSoft(id: string) {
  return apiRequest<SoftDto>(`${softPath}/${encodeURIComponent(id)}`)
}

export function createSoft(dto: SoftCreateDto, token?: string) {
  return apiRequest<SoftDto>(softPath, {
    method: 'POST',
    body: dto,
    token,
  })
}

export function updateSoft(id: string, dto: SoftUpdateDto, token?: string) {
  return apiRequest<void>(`${softPath}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dto,
    token,
  })
}

export function deleteSoft(id: string, token?: string) {
  return apiRequest<void>(`${softPath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
