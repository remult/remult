import type { ClassType } from '../classType.js'
import type {
  FieldMetadata,
  FieldOptions,
  ValueConverter,
} from './column-interfaces.js'
import type { EntityFilter } from './remult3/remult3.js'

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
    let get = (field: FieldMetadata) => {
      return instance[field.key]
    }
    if (typeof instance === 'function') {
      get = instance
    }
    let r = ''
    this.fields.forEach((c) => {
      if (r.length > 0) r += ','
      r += c.valueConverter.toJson(get(c))
    })
    return r
  }
  options: FieldOptions = {}
  get valueConverter(): Required<ValueConverter<string>> {
    throw new Error('cant get value converter of compound id')
  }

  target!: ClassType<any>
  readonly = true

  allowNull = false
  dbReadOnly = false
  isServerExpression = false
  key = ''
  label = ''
  caption = ''
  inputType = ''
  dbName = ''

  valueType: any
  isEqualTo(value: FieldMetadata<string> | string): EntityFilter<any> {
    let result: any = {}
    let val = value.toString()
    let id = val.split(',')
    this.fields.forEach((c, i) => {
      result[c.key] = c.valueConverter.fromJson(id[i])
    })
    return result
  }
}
