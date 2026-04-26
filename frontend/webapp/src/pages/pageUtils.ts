export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return '请求失败，请稍后重试。'
}
