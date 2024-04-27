import { getValueList, type FieldMetadata, type ValueListItem } from 'remult'

export function getFieldSelectInfo<T extends string | ValueListItem | unknown>(
  field?: FieldMetadata<T>,
): FieldSelectInfo<T> | undefined {
  if (!field) return undefined
  const valueList = getValueList(field)
  if (!valueList) return undefined
  if (typeof valueList[0] === 'string')
    return {
      valueFromId: (id?: string) => id as T,
      getValueList: () =>
        //@ts-expect-error this case should return the ValueListItem version of the array
        valueList.map((v) => ({ id: v, caption: v })) as ValueListItem[],
      idFromValue: (value: T) => (value as string) || '',
    }
  return {
    valueFromId: (id?: string) =>
      (valueList as ValueListItem[]).find((v) => v.id === id) as T,
    //@ts-expect-error this case should return the original object array
    getValueList: () => valueList as T[],
    idFromValue: (value: T) =>
      value ? (value as ValueListItem).id : undefined,
  }
}

export type FieldSelectInfo<T extends string | ValueListItem | unknown> = {
  valueFromId(id?: string): T | undefined
  getValueList(): T extends ValueListItem ? T[] : ValueListItem[]
  idFromValue(value: T): string | undefined
}
