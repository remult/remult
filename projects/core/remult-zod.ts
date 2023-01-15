import * as z from 'zod';
import { ZodObject, ZodRawShape } from 'zod';
import { bigint, ZodFirstPartyTypeKind } from 'zod/lib';
import { FieldOptions } from './src/column-interfaces';
import { EntityInfoProvider, Remult } from './src/context';
import { EntityOptions } from './src/entity';
import { $fieldOptionsMember, MemberType } from './src/remult3';

const $remultFieldOptions = Symbol("$remultFieldOptions")

export function zodEntity<zodType extends ZodRawShape>(key: string, zodType: ZodObject<zodType>, options: EntityOptions<zodType>)
  : ZodObject<zodType> & EntityInfoProvider<z.infer<ZodObject<zodType>>> {
  return Object.assign(zodType, {
    $entity$key: key,
    $entity$getInfo: (remult: Remult) => {
      const fields: FieldOptions[] = [];
      for (const key in zodType.shape) {
        if (Object.prototype.hasOwnProperty.call(zodType.shape, key)) {
          const element = zodType.shape[key];
          const o: FieldOptions = { key }

          switch (element._def.typeName) {
            case ZodFirstPartyTypeKind.ZodString:
              o.valueType = String;
              break;
            case ZodFirstPartyTypeKind.ZodNumber:
              o.valueType = Number;
              break;
            case ZodFirstPartyTypeKind.ZodBoolean:
              o.valueType = Boolean;
              break;
            case ZodFirstPartyTypeKind.ZodDate:
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
export function zodField<zodType extends z.ZodType>(zodType: zodType, ...options: (FieldOptions<any, z.infer<zodType>> | MemberType<InstanceType<z.infer<zodType>>>)[]) {
  zodType._def[$remultFieldOptions] = options;
  return zodType;
}

