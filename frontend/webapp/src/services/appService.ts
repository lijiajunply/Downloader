import type {
  AppCreateDto,
  AppDetailDto,
  AppDto,
  AppLatestVersionDto,
  AppUpdateDto,
} from '@/types'
import { apiRequest } from './http'

const appPath = '/api/App'

export function getApps() {
  return apiRequest<AppDto[]>(appPath)
}

export function getApp(id: string) {
  return apiRequest<AppDetailDto>(`${appPath}/${encodeURIComponent(id)}`)
}

export function getLatestAppVersion(id: string, channelId?: string) {
  return apiRequest<AppLatestVersionDto>(`${appPath}/${encodeURIComponent(id)}/latest`, {
    query: { channelId },
  })
}

export function createApp(dto: AppCreateDto, token?: string) {
  return apiRequest<AppDto>(appPath, {
    method: 'POST',
    body: dto,
    token,
  })
}

export function updateApp(id: string, dto: AppUpdateDto, token?: string) {
  return apiRequest<void>(`${appPath}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dto,
    token,
  })
}

export function uploadAppIcon(id: string, file: File, token?: string) {
  const formData = new FormData()
  formData.set('file', file)

  return apiRequest<AppDto>(`${appPath}/${encodeURIComponent(id)}/icon`, {
    method: 'POST',
    body: formData,
    token,
  })
}

export function deleteApp(id: string, token?: string) {
  return apiRequest<void>(`${appPath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
