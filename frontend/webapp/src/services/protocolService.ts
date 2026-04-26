import type { ProtocolCreateDto, ProtocolDto, ProtocolUpdateDto } from '@/types'
import { apiRequest } from './http'

const protocolPath = '/api/Protocol'

export function getProtocolList() {
  return apiRequest<ProtocolDto[]>(protocolPath)
}

export function getProtocol(id: string) {
  return apiRequest<ProtocolDto>(`${protocolPath}/${encodeURIComponent(id)}`)
}

export function createProtocol(dto: ProtocolCreateDto, token?: string) {
  return apiRequest<ProtocolDto>(protocolPath, {
    method: 'POST',
    body: dto,
    token,
  })
}

export function updateProtocol(id: string, dto: ProtocolUpdateDto, token?: string) {
  return apiRequest<void>(`${protocolPath}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dto,
    token,
  })
}

export function deleteProtocol(id: string, token?: string) {
  return apiRequest<void>(`${protocolPath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
