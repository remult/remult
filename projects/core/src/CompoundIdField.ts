import type { ClassType } from '../classType'
import type {
  FieldMetadata,
  FieldOptions,
  ValueConverter,
} from './column-interfaces'
import type { EntityFilter } from './remult3/remult3'

export class CompoundIdField implements FieldMetadata<string> {
  fields: FieldMetadata[]
  constructor(...columns: FieldMetadata[]) {
    this.fields = columns
  }
  apiUpdateAllowed(item: any): boolean {
    throw new Error('Method not implemented.')
  }
  displayValue(item: any): string {
    throw new Error('Method not implemented.')
  }
  includedInApi(item: any): boolean {
    throw new Error('Method not implemented.')
  }
  toInput(value: string, inputType?: string): string {
    throw new Error('Method not implemented.')
  }
  fromInput(inputValue: string, inputType?: string): string {
    throw new Error('Method not implemented.')
  }
  getDbName(): Promise<string> {
    return Promise.resolve('')
  }
  getId(instance: any) {
    let r = ''
    this.fields.forEach((c) => {
      if (r.length > 0) r += ','
      r += instance[c.key]
    })
    return r
  }
  options: FieldOptions<any, any>
  get valueConverter(): Required<ValueConverter<string>> {
    throw new Error('cant get value converter of compound id')
  }

  target: ClassType<any>
  readonly: true

  allowNull: boolean
  dbReadOnly: boolean
  isServerExpression: boolean
  key: string
  caption: string
  inputType: string
  dbName: string

  valueType: any
  isEqualTo(value: FieldMetadata<string> | string): EntityFilter<any> {
    let result = {}
    let val = value.toString()
    let id = val.split(',')
    this.fields.forEach((c, i) => {
      result[c.key] = id[i]
    })
    return result
  }
}
