// Input validation utilities for API routes

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MAX_MESSAGE_LENGTH = 50000
const MAX_TEXT_LENGTH = 100000

export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

export function isValidMessage(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_MESSAGE_LENGTH
}

export function isValidText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_TEXT_LENGTH
}

/**
 * Sanitize error for client response. Logs the real error, returns generic message.
 */
export function safeErrorResponse(context: string, error: unknown): string {
  console.error(`[${context}]`, error)
  return 'An internal error occurred'
}
