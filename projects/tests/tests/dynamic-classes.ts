import {
  describeClass,
  Entity,
  type OmitEB,
  type EntityOptions,
  Fields,
  type MemberDecorator,
} from '../../core'
import type { ClassType } from '../../core/classType'

export declare type InferMemberType<type> = type extends MemberDecorator<
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
  [member in keyof OmitEB<type>]: InferMemberType<type[member]>
}

export function createEntity<T>(
  key: string,
  members: T,
  options?: EntityOptions<InferredType<T>>,
): { new (...args: any[]): InferredType<T> } {
  const r = class {} as ClassType<InferredType<T>>

  //@ts-ignore
  describeClass(r, Entity(key, options), members)
  //@ts-ignore
  return r
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
