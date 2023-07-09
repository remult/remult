import { OmitEB } from './remult3'

type Decorator<T = any> = (a: T, b: string, c?: any) => void
type Decorators<T> = T extends new (...args: any[]) => infer R
  ? { [K in keyof OmitEB<R>]?: Decorator }
  : never
type StaticDecorators<T> = { [K in keyof T]?: Decorator }

export function describeClass<classType>(
  classType: classType,
  classDecorator: ((x: any, context?: any) => any) | undefined,
  members?: Decorators<classType> | undefined,
  staticMembers?: StaticDecorators<classType>,
) {
  if (classDecorator) classDecorator(classType)
  for (const fieldKey in members) {
    if (Object.prototype.hasOwnProperty.call(members, fieldKey)) {
      const element: any = members[fieldKey]
      const prop = Object.getOwnPropertyDescriptor(
        (classType as any).prototype,
        fieldKey,
      )

      element((classType as any).prototype, fieldKey, prop)
      if (prop)
        Object.defineProperty((classType as any).prototype, fieldKey, prop)
    }
  }

  for (const staticFieldKey in staticMembers) {
    const staticElement = staticMembers[staticFieldKey]
    const prop = Object.getOwnPropertyDescriptor(classType, staticFieldKey)
    staticElement(classType, staticFieldKey, prop)
    if (prop) Object.defineProperty(classType, staticFieldKey, prop)
  }
}
