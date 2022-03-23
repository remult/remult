import { ClassType } from "./classType";
import { InputTypes } from "./inputTypes";
import { makeTitle } from "./src/column";
import { ValueConverter, ValueListItem } from "./src/column-interfaces";
import { storableMember, ValueListFieldOptions } from "./src/remult3";





export class ValueListValueConverter<T extends ValueListItem> implements ValueConverter<T>{
  private info = ValueListInfo.get(this.type);
  constructor(private type: ClassType<T>) {
    if (this.info.isNumeric) {
      this.fieldTypeInDb = 'integer';
    }
  }
  fromJson(val: any): T {
    return this.byId(val);
  }
  toJson(val: T) {
    if (!val)
      return undefined;
    return val.id;
  }
  fromDb(val: any): T {
    return this.fromJson(val);
  }
  toDb(val: T) {
    return this.toJson(val);
  }
  toInput(val: T, inputType: string): string {
    return this.toJson(val);
  }
  fromInput(val: string, inputType: string): T {
    return this.fromJson(val);
  }
  displayValue?(val: T): string {
    if (!val)
      return '';
    return val.caption;
  }
  fieldTypeInDb?: string;
  inputType?: string;
  getOptions() {
    return this.info.getOptions();
  }
  byId(key: any) {
    if (key === undefined)
      return undefined;
    if (this.info.isNumeric)
      key = +key;

    return this.info.byId(key);
  }
}



class ValueListInfo<T extends ValueListItem> {
  static get<T extends ValueListItem>(type: ClassType<T>): ValueListInfo<T> {
    let r = typeCache.get(type);
    if (!r)
      r = new ValueListInfo(type);
    typeCache.set(type, r);
    return r;
  }
  private byIdMap = new Map<any, T>();
  private values: T[] = [];
  isNumeric = false;
  private constructor(private valueListType: any) {

    for (let member in this.valueListType) {
      let s = this.valueListType[member] as T;
      if (s instanceof this.valueListType) {
        if (s.id === undefined)
          s.id = member;
        if (s.caption === undefined)
          s.caption = makeTitle(member);
        if (typeof s.id === 'number')
          this.isNumeric = true;
        this.byIdMap.set(s.id, s);
        this.values.push(s);
      }
    }

    var options = Reflect.getMetadata(storableMember, valueListType) as ValueListFieldOptions<any, any>[];
    if (options)
      for (const op of options) {
        if (op?.getValues)
          this.values = op.getValues();
      }
  }

  getOptions() {
    return this.values;
  }
  byId(key: any) {
    if (this.isNumeric)
      key = +key;
    return this.byIdMap.get(key);
  }
}
const typeCache = new Map<any, ValueListInfo<any>>();


export class ValueConverters {

  static readonly Date: ValueConverter<Date> = {
    toJson: (val: Date) => {
      if (!val)
        return '';
      if (typeof (val) === "string")
        val = new Date(val);
      if (val instanceof Date) {
        return val.toISOString();
      }
      else {
        console.log("ToJsonError", val);
        throw new Error("Expected date but got val");
      }

    },
    fromJson: (val: string) => {
      if (val == undefined)
        return undefined;
      if (val == '')
        return undefined;
      if (val.startsWith('0000-00-00'))
        return undefined;
      return new Date(Date.parse(val));
    },
    toDb: x => x,
    fromDb: x => x,
    fromInput: x => ValueConverters.Date.fromJson(x),
    toInput: x => ValueConverters.Date.toJson(x),
    displayValue: (val) => {
      if (!val)
        return '';
      return val.toLocaleString();
    }
  }

  static readonly DateOnly: ValueConverter<Date> = {
    fromInput: x => ValueConverters.DateOnly.fromJson(x),
    toInput: x => ValueConverters.DateOnly.toJson(x),
    toJson: (val: Date) => {
      var d = val;
      if (typeof d === "string" || typeof (d) === "number")
        d = new Date(d);
      if (!d || d == null)
        return null;

      if (d.getHours() == 0)
        return new Date(d.valueOf() - d.getTimezoneOffset() * 60000).toISOString().substring(0, 10)
      else
        return d.toISOString().substring(0, 10);
    },
    fromJson: (value: string) => {
      if (!value || value == '' || value == '0000-00-00')
        return null;
      let d = new Date(Date.parse(value));
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return d;
    },
    inputType: InputTypes.date,
    toDb: (val: Date) => {

      if (!val)
        return null;
      return ValueConverters.DateOnly.fromJson(ValueConverters.DateOnly.toJson(val));

    }//when using date storage,  the database expects and returns a date local and every where else we reflect on date iso
    , fromDb: (val: Date) => {

      var d = val as Date;
      if (!d)
        return null;
      return val;

    },
    fieldTypeInDb: 'date',
    displayValue: (value: Date) => {
      if (!value)
        return '';
      return value.toLocaleDateString(undefined)
    }
  }
  static readonly DateOnlyString: ValueConverter<Date> = {
    ...ValueConverters.DateOnly,
    toDb: (d: Date) => {
      let val = ValueConverters.DateOnly.toJson(d);
      if (!val)
        return undefined;
      return val.replace(/-/g, '');

    }
    , fromDb: (val: string) => {
      if (!val)
        return undefined;
      return new Date(val.substring(0, 4) + '-' + val.substring(4, 6) + '-' + val.substring(6, 8));
    }
  }


  static readonly Boolean: ValueConverter<Boolean> = {
    toDb: (val: boolean) => val,
    inputType: InputTypes.checkbox,
    fromDb: (value: any) => {
      return ValueConverters.Boolean.fromJson(value);
    },
    fromJson: value => {
      if (typeof value === "boolean")
        return value;
      if (value !== undefined && value !== null) {
        return value.toString().trim().toLowerCase() == 'true';
      }
      return value;
    },
    toJson: x => x,
    fromInput: x => ValueConverters.Boolean.fromJson(x),
    toInput: x => ValueConverters.Boolean.toJson(x)
  }


  static readonly Number: ValueConverter<number> =
    {
      fromDb: value => {
        if (value !== undefined)
          return +value;
        return undefined;
      },
      toDb: value => value,
      fromJson: value => ValueConverters.Number.fromDb(value),
      toJson: value => ValueConverters.Number.toDb(value),
      fromInput: (x, type) => {
        let r = +x;
        if (!x)
          return undefined;
        return r;
      },
      toInput: (x, type) => {

        return x?.toString();
      },
      inputType: InputTypes.number

    }
  static readonly Integer: ValueConverter<number> =
    {
      ...ValueConverters.Number,
      toJson: value => {
        let val = ValueConverters.Number.toDb(value);
        if (!val)
          return val;
        return +(+val).toFixed(0);

      },
      toDb: value => ValueConverters.Integer.toJson(value),
      fieldTypeInDb: 'integer'
    }
  static readonly Default: ValueConverter<any> = {
    fromJson: x => x,
    toJson: x => x,
    fromDb: x => ValueConverters.JsonString.fromDb(x),
    toDb: x => ValueConverters.JsonString.toDb(x),
    fromInput: x => ValueConverters.Default.fromJson(x),
    toInput: x => ValueConverters.Default.toJson(x)
  }
  static readonly JsonString: ValueConverter<any> = {
    fromJson: x => x,
    toJson: x => x,
    fromDb: x => x == null ? null : x ? JSON.parse(ValueConverters.JsonString.fromJson(x)) : undefined,
    toDb: x => x !== undefined ? x === null ? null : JSON.stringify(ValueConverters.JsonString.toJson(x)) : undefined,
    fromInput: x => ValueConverters.JsonString.fromJson(x),
    toInput: x => ValueConverters.JsonString.toJson(x)
  }
  static readonly JsonValue: ValueConverter<any> = {
    fromJson: x => x,
    toJson: x => x,
    fromDb: x => x,
    toDb: x => x,
    fromInput: x => ValueConverters.JsonString.fromJson(x),
    toInput: x => ValueConverters.JsonString.toJson(x),
    fieldTypeInDb: 'json'
  }
}