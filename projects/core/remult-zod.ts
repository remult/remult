import {  ZodObject, ZodRawShape, ZodError, infer as zInfer, ZodType, UnknownKeysParam, ZodTypeAny, objectOutputType, ZodObjectDef, objectInputType, string } from 'zod';

import { FieldOptions } from './src/column-interfaces';
import { EntityInfoProvider, Remult } from './src/context';
import { EntityOptions } from './src/entity';
import { $fieldOptionsMember, MemberType } from './src/remult3';

const $remultFieldOptions = Symbol("$remultFieldOptions")

export function zodEntity<zodType extends ZodRawShape>(key: string, zodType: ZodObject<zodType>, options: EntityOptions<zInfer<ZodObject<zodType>>>)
  : ZodObject<zodType> & EntityInfoProvider<zInfer<ZodObject<zodType>>> {
  return Object.assign(zodType, {
    $entity$key: key,
    $entity$getInfo: (remult: Remult) => {
      const fields: FieldOptions[] = [];
      for (const key in zodType.shape) {
        if (Object.prototype.hasOwnProperty.call(zodType.shape, key)) {
          const element = zodType.shape[key];
          const o: FieldOptions = { key }

          switch (element._def.typeName) {
            case "ZodString"://ZodFirstPartyTypeKind.ZodString:
              o.valueType = String;
              break;
            case "ZodNumber"://ZodFirstPartyTypeKind.ZodNumber:
              o.valueType = Number;
              break;
            case "ZodBoolean"://ZodFirstPartyTypeKind.ZodBoolean:
              o.valueType = Boolean;
              break;
            case "ZodDate"://ZodFirstPartyTypeKind.ZodDate:
              o.valueType = Date;
              break;
          }
          const fieldOptions = element._def[$remultFieldOptions];
          if (fieldOptions)
            for (const fo of fieldOptions) {
              let fieldInfo = fo[$fieldOptionsMember];
              if (fieldInfo) {
                Object.assign(o, fieldInfo(remult));
              }
              else
                Object.assign(o, fo);
            }

          let prev = o.validate;
          o.validate = (_, ref) => {
            try {
              const r = element.parse(ref.value)
              if (ref.value === undefined)
                ref.value = r;
            }
            catch (err: any) {
              const zerr = err as ZodError;
              if (zerr.issues) {
                throw zerr.issues[0].message
              }
            }
          }
          if (prev) {
            if (Array.isArray(prev)) {
              prev.push(o.validate);
              o.validate = prev;
            }
            else {
              o.validate = [o.validate, prev]
            }
          }
          fields.push(o);
        }
      }

      return {
        options,
        fields
      }
    }
  } as EntityInfoProvider<zodType>);
}
export function zodField<zodType extends ZodType>(zodType: zodType, ...options: (FieldOptions<any, zInfer<zodType>> | MemberType<InstanceType<zInfer<zodType>>>)[]) {
  zodType._def[$remultFieldOptions] = options;
  return zodType;
}






/*

import { EntityOptions, Field, FieldOptions, Fields } from 'remult';
import { zodEntity, zodField } from 'remult/remult-zod';
import { EntityInfoProvider } from 'remult/src/context';
import { MemberType } from 'remult/src/remult3';
import { objectInputType, objectOutputType, UnknownKeysParam, ZodObject, ZodObjectDef, ZodRawShape, ZodType, ZodTypeAny, infer as zInfer, ZodNumber, ZodBoolean, ZodString, ZodDate } from 'zod';


declare module 'zod' {
  export interface ZodObject<T extends ZodRawShape, UnknownKeys extends UnknownKeysParam = "strip", Catchall extends ZodTypeAny = ZodTypeAny, Output = objectOutputType<T, Catchall>, Input = objectInputType<T, Catchall>> extends ZodType<Output, ZodObjectDef<T, UnknownKeys, Catchall>, Input> {
    entity(key: string, options: EntityOptions<any>): ZodObject<T> & EntityInfoProvider<zInfer<ZodObject<T>>>
  }
  export interface ZodNumber {
    field(...options: (FieldOptions<any, number> | MemberType<Number>)[]): ZodNumber
    autoIncrementField(...options: (FieldOptions<any, number> | MemberType<Number>)[]): ZodNumber
  }
  export interface ZodString {
    field(...options: (FieldOptions<any, string> | MemberType<String>)[]): ZodString
  }
  export interface ZodDate {
    field(...options: (FieldOptions<any, Date> | MemberType<Date>)[]): ZodDate
  }
  export interface ZodBoolean {
    field(...options: (FieldOptions<any, boolean> | MemberType<Boolean>)[]): ZodBoolean
  }
}


Object.defineProperty(ZodObject.prototype, "entity", {
  value: function (key: string, options: EntityOptions<any>) {
    return zodEntity(key, this, options as any)
  },
  configurable: true
})
for (const type of [ZodNumber, ZodDate, ZodBoolean, ZodString]) {
  Object.defineProperty(ZodNumber.prototype, "field", {
    value: function (options: any) {
      const r = zodField(this, options)
      return r;
    },
    configurable: true
  })
}

Object.defineProperty(ZodNumber.prototype, "autoIncrementField", {
  value: function (...options: any[]) {
    console.log(options);
    const r = zodField(this, Fields.autoIncrement(), ...options)
    return r;
  },
  configurable: true
})


export function describeZodEntity<zodType extends ZodRawShape>(
  key: string,
  zodType: ZodObject<zodType>,
  options: EntityOptions<zInfer<ZodObject<zodType>>>,
  members: members<ZodObject<zodType>>
) {

}

export declare type members<T extends { shape: any }> = {
  [key in keyof Partial<T["shape"]>]?: FieldOptions | MemberType<any>
}

*/