import type { ChannelCreateDto, ChannelDto, ChannelUpdateDto } from '@/types'
import { apiRequest } from './http'

const channelPath = '/api/Channel'

export function getChannelList() {
  return apiRequest<ChannelDto[]>(channelPath)
}

export function getChannel(id: string) {
  return apiRequest<ChannelDto>(`${channelPath}/${encodeURIComponent(id)}`)
}

export function createChannel(dto: ChannelCreateDto, token?: string) {
  return apiRequest<ChannelDto>(channelPath, {
    method: 'POST',
    body: dto,
    token,
  })
}

export function updateChannel(id: string, dto: ChannelUpdateDto, token?: string) {
  return apiRequest<void>(`${channelPath}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dto,
    token,
  })
}

export function deleteChannel(id: string, token?: string) {
  return apiRequest<void>(`${channelPath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
