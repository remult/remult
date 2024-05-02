import { ClassType } from '../../classType.js'
import { EntityOptions } from '../entity.js'
import { BackendMethod, BackendMethodOptions } from '../server-action.js'
import { Fields } from './Fields.js'
import { Entity } from './entity.js'

type Descriptor<T = any> = (a: T, b: string, c?: any) => void
type FieldsDescriptor<T> = T extends new (...args: any[]) => infer R
  ? { [K in keyof R]?: Descriptor }
  : never
type StaticMemberDescriptors<T> = { [K in keyof T]?: Descriptor }

export function describeClass<classType>(
  classType: classType,
  classDescriber: ((x: any, context?: any) => any) | undefined,
  members?: FieldsDescriptor<classType> | undefined,
  staticMembers?: StaticMemberDescriptors<classType>,
) {
  if (classDescriber) classDescriber(classType)
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
export function describeBackendMethods<T>(
  classType: T,

  backendMethods: { [K in keyof T]?: BackendMethodOptions<unknown> },
) {
  let result: Record<string, Descriptor> = {}
  for (const key in backendMethods) {
    if (Object.prototype.hasOwnProperty.call(backendMethods, key)) {
      const options = backendMethods[key]
      result[key] = BackendMethod(options)
    }
  }

  describeClass(classType, undefined, undefined, result)
}

export function describeEntity<entityType extends ClassType<any>>(
  classType: entityType,
  key: string,
  fields: FieldsDescriptor<entityType>,
  options?: EntityOptions<InstanceType<entityType>>,
) {
  describeClass(
    classType,
    Entity<InstanceType<entityType>>(key, options),
    fields,
  )
}
