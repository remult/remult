import type { CookieParseOptions, CookieSerializeOptions } from 'cookie'
import { parse as parseCookie, serialize as serializeCookie } from 'cookie'

// Default cookie options
const DEFAULT_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
}

export type { CookieParseOptions, CookieSerializeOptions }

export function parse(cookieHeader: string, options: CookieParseOptions = {}) {
  return parseCookie(cookieHeader, options)
}

export function serialize(name: string, value: string, options: CookieSerializeOptions = {}) {
	const cookieOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options }
  return serializeCookie(name, value, cookieOptions)
}