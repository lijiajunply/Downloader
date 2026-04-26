const defaultApiBaseUrl = 'http://localhost:5046'

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string
  query?: Record<string, string | number | boolean | null | undefined>
  headers?: HeadersInit
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token, query, headers } = options
  const url = buildUrl(path, query)
  const requestHeaders = new Headers(headers)

  requestHeaders.set('Accept', 'application/json')

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const details = await readResponseBody(response)
    throw new ApiError(response.status, getErrorMessage(details, response.statusText), details)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await readResponseBody(response)) as T
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text.length > 0 ? text : undefined
}

function getErrorMessage(details: unknown, fallback: string) {
  if (typeof details === 'string' && details.length > 0) {
    return details
  }

  if (
    details &&
    typeof details === 'object' &&
    'message' in details &&
    typeof details.message === 'string'
  ) {
    return details.message
  }

  return fallback || 'Request failed'
}
