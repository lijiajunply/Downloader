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

export function uploadSoftPackage(
  dto: Omit<SoftCreateDto, 'softUrl'> & { file: File },
  token?: string,
) {
  const formData = new FormData()
  formData.set('name', dto.name)
  formData.set('description', dto.description)
  formData.set('releaseId', dto.releaseId)
  formData.set('channelId', dto.channelId)
  formData.set('file', dto.file)

  return apiRequest<SoftDto>(`${softPath}/upload`, {
    method: 'POST',
    body: formData,
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
