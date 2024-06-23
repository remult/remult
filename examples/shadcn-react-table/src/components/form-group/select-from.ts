import { IdSelectValueType } from './id-value-select'
import { ClassType, repo } from 'remult'

export function selectFrom<T>(type: ClassType<T>) {
  const r = repo(type)
  const idField = 'id' as keyof T
  const captionField = r.fields
    .toArray()
    .find((f) => f.valueType == String && f.key != idField)?.key as keyof T

  return {
    type: 'selectId',
    getOptions: async (search: string) =>
      (
        await r.find({
          limit: 25,
          // @ts-expect-error - captionField is a string
          where: { [captionField]: { $contains: search } },
        })
      ).map((c) => ({ id: c[idField], caption: c[captionField] })),
    displayValue: async (id: string) =>
      (
        await r.findId(
          //@ts-expect-error - idField is a string
          id,
        )
      )?.[captionField] ?? '',
  } as IdSelectValueType
}
