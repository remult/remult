import {
  describeClass,
  Entity,
  type EntityOptions,
  Fields,
  type ClassFieldDecorator,
} from '../../core'
import type { ClassType } from '../../core/classType'

export declare type InferMemberType<type> = type extends ClassFieldDecorator<
  any,
  infer R
>
  ? R
  : type extends () => infer R
  ? R
  : type extends ClassType<infer R>
  ? R
  : InferredType<type>

export declare type InferredType<type> = {
  [member in keyof type]: InferMemberType<type[member]>
}

export function createEntity<T>(
  key: string,
  members: T,
  options?: EntityOptions<InferredType<T>>,
): { new (...args: any[]): InferredType<T> } {
  const z = { [key]: class {} as ClassType<InferredType<T>> }

  //@ts-ignore
  describeClass(z[key], Entity(key, options), members)
  //@ts-ignore
  return z[key]
}

function test() {
  const Category = createEntity('c', {
    id: Fields.cuid(),
    name: Fields.string(),
  })
  const Task = createEntity(
    'c',
    {
      id: Fields.cuid(),
      title: Fields.string(),
    },
    {
      allowApiCrud: true,
      saving: (item) => {},
    },
  )
}
