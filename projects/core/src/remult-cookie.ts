import type { ParseOptions, SerializeOptions } from 'cookie'
import { parse as parseCookie, serialize as serializeCookie } from 'cookie'
export type { ParseOptions, SerializeOptions }

// Default cookie options
const DEFAULT_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
}

export function parse(cookieHeader: string, options: ParseOptions = {}) {
  return parseCookie(cookieHeader, options)
}

export function serialize(
  name: string,
  value: string,
  options: SerializeOptions = {},
) {
  const cookieOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options }
  return serializeCookie(name, value, cookieOptions)
}

export const mergeOptions = (options: SerializeOptions) => {
  return { ...DEFAULT_COOKIE_OPTIONS, ...options }
}
