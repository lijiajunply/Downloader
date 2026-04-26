import { ApiError } from '@/services'
import { getErrorMessage } from '../pageUtils'

export function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return '当前账号没有 Admin 权限。'
  }

  return getErrorMessage(error)
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export function asLoadState<T>(items: T[]) {
  return items.length > 0
    ? ({ status: 'success', data: items } as const)
    : ({ status: 'empty' } as const)
}

export function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value || '未知日期'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function truncateText(value: string, maxLength = 120) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength)}...`
}
