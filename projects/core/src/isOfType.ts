export function isOfType<T>(obj: any, checkMethod: keyof T): obj is T {
  return typeof obj[checkMethod] === 'function'
}
export function cast<T>(obj: any, checkMethod: keyof T): T {
  if (isOfType<T>(obj, checkMethod)) {
    return obj
  }
  throw new Error(`Object is not of type ${checkMethod.toString()}`)
}
