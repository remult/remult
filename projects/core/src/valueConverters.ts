import { ClassType } from '../classType'
import { InputTypes } from '../inputTypes'
import { makeTitle } from './column'
import { ValueConverter, ValueListItem } from './column-interfaces'
import { storableMember, ValueListFieldOptions } from './remult3'

export class ValueConverters {
  static readonly Date: ValueConverter<Date> = {
    toJson: (val: Date) => {
      if (val === null) return null
      if (!val) return ''
      if (typeof val === 'string') val = new Date(val)
      if (val instanceof Date) {
        return val.toISOString()
      } else {
        throw new Error('Expected date but got ' + val)
      }
    },
    fromJson: (val: string) => {
      if (val === null) return null
      if (val == undefined) return undefined
      if (val == '') return undefined
      if (val.startsWith('0000-00-00')) return undefined
      return new Date(Date.parse(val))
    },
    toDb: (x) => x,
    fromDb: (val) => {
      if (typeof val === 'number') val = new Date(val)
      if (typeof val === 'string') val = new Date(val)
      if (val && !(val instanceof Date)) throw 'expected date but got ' + val
      return val
    },
    fromInput: (x) => ValueConverters.Date.fromJson(x),
    toInput: (x) => ValueConverters.Date.toJson(x),
    displayValue: (val) => {
      if (!val) return ''
      return val.toLocaleString()
    },
  }

  static readonly DateOnly: ValueConverter<Date> = {
    fromInput: (x) => ValueConverters.DateOnly.fromJson(x),
    toInput: (x) => ValueConverters.DateOnly.toJson(x),
    toJson: (val: Date) => {
      var d = val
      if (typeof d === 'string' || typeof d === 'number') d = new Date(d)
      if (!d || d == null) return null

      if (d.getHours() == 0)
        return new Date(d.valueOf() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .substring(0, 10)
      else return d.toISOString().substring(0, 10)
    },
    fromJson: (value: string) => {
      if (!value || value == '' || value == '0000-00-00') return null
      let d = new Date(Date.parse(value))
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
      return d
    },
    inputType: InputTypes.date,
    toDb: (val: Date) => {
      if (!val) return null
      return ValueConverters.DateOnly.fromJson(
        ValueConverters.DateOnly.toJson(val),
      )
    }, //when using date storage,  the database expects and returns a date local and every where else we reflect on date iso
    fromDb: (val: Date) => {
      return ValueConverters.Date.fromDb(val)
    },
    fieldTypeInDb: 'date',
    displayValue: (value: Date) => {
      if (!value) return ''
      return value.toLocaleDateString(undefined)
    },
  }
  static readonly DateOnlyString: ValueConverter<Date> = {
    ...ValueConverters.DateOnly,
    toDb: (d: Date) => {
      let val = ValueConverters.DateOnly.toJson(d)
      if (!val) return undefined
      return val.replace(/-/g, '')
    },
    fromDb: (val: string) => {
      if (val === null) return null
      if (!val) return undefined
      return new Date(
        val.substring(0, 4) +
          '-' +
          val.substring(4, 6) +
          '-' +
          val.substring(6, 8),
      )
    },
  }

  static readonly Boolean: ValueConverter<Boolean> = {
    toDb: (val: boolean) => val,
    inputType: InputTypes.checkbox,
    fromDb: (value: any) => {
      return ValueConverters.Boolean.fromJson(value)
    },
    fromJson: (value) => {
      if (typeof value === 'boolean') return value
      if (value === 1) return true
      if (value !== undefined && value !== null) {
        return value.toString().trim().toLowerCase() == 'true'
      }
      return value
    },
    toJson: (x) => x,
    fromInput: (x) => ValueConverters.Boolean.fromJson(x),
    toInput: (x) => ValueConverters.Boolean.toJson(x),
  }

  static readonly Number: ValueConverter<number> = {
    fromDb: (value) => {
      if (value === null) return null
      if (value !== undefined) return +value
      return undefined
    },
    toDb: (value) => value,
    fromJson: (value) => ValueConverters.Number.fromDb(value),
    toJson: (value) => ValueConverters.Number.toDb(value),
    fromInput: (x, type) => {
      let r = +x
      if (!x) return undefined
      return r
    },
    toInput: (x, type) => {
      return x?.toString()
    },
    inputType: InputTypes.number,
  }
  static readonly String: ValueConverter<String> = {
    fromDb: enforceString,
    toDb: enforceString,
    fromJson: enforceString,
    toJson: enforceString,
    fromInput: enforceString,
    toInput: enforceString,
  }
  static readonly Integer: ValueConverter<number> = {
    ...ValueConverters.Number,
    toJson: (value) => {
      let val = ValueConverters.Number.toDb(value)
      if (!val) return val
      return +(+val).toFixed(0)
    },
    toDb: (value) => ValueConverters.Integer.toJson(value),
    fieldTypeInDb: 'integer',
  }
  static readonly Default: Required<ValueConverter<any>> = {
    fromJson: (x) => x,
    toJson: (x) => x,
    fromDb: (x) => ValueConverters.JsonString.fromDb(x),
    toDb: (x) => ValueConverters.JsonString.toDb(x),
    fromInput: (x) => ValueConverters.Default.fromJson(x),
    toInput: (x) => ValueConverters.Default.toJson(x),
    displayValue: (x) => x + '',
    fieldTypeInDb: '',
    inputType: 'text',
  }
  static readonly JsonString: ValueConverter<any> = {
    fromJson: (x) => x,
    toJson: (x) => x,
    fromDb: (x) =>
      x == null
        ? null
        : x
        ? JSON.parse(ValueConverters.JsonString.fromJson(x))
        : undefined,
    toDb: (x) =>
      x !== undefined
        ? x === null
          ? null
          : JSON.stringify(ValueConverters.JsonString.toJson(x))
        : undefined,
    fromInput: (x) => ValueConverters.JsonString.fromJson(x),
    toInput: (x) => ValueConverters.JsonString.toJson(x),
  }
  static readonly JsonValue: ValueConverter<any> = {
    fromJson: (x) => x,
    toJson: (x) => x,
    fromDb: (x) => x,
    toDb: (x) => x,
    fromInput: (x) => ValueConverters.JsonString.fromJson(x),
    toInput: (x) => ValueConverters.JsonString.toJson(x),
    fieldTypeInDb: 'json',
  }
}
function enforceString(value: string) {
  if (value === null || value === undefined) return value
  if (typeof value !== 'string') return (value as any).toString()
  return value
}
