import { remult } from '../index.js'

export const getHeader = (key: string) => {
  return remult.context.platform?.getHeader(key) ?? undefined
}

export const getHeaders = () => {
  return remult.context.platform?.getHeaders() ?? {}
}
