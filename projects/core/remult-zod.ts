import * as z from 'zod';
import { ZodObject, ZodRawShape } from 'zod';
import { bigint, ZodFirstPartyTypeKind } from 'zod/lib';
import { FieldOptions } from './src/column-interfaces';
import { EntityInfoProvider } from './src/context';
import { EntityOptions } from './src/entity';

export function zodEntity<T extends ZodRawShape>(key: string, z: ZodObject<T>, options: EntityOptions<T>)
  : ZodObject<T> & EntityInfoProvider<z.infer<ZodObject<T>>> {
  return Object.assign(z, {
    getEntityInfo: () => {
      const fields: FieldOptions[] = [];
      for (const key in z.shape) {
        if (Object.prototype.hasOwnProperty.call(z.shape, key)) {
          const element = z.shape[key];
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
          fields.push(o);
        }
      }

      return {
        options,
        key,
        fields
      }
    }
  } as EntityInfoProvider<T>);
}
export function zodField<T extends z.ZodType>(zodType: T, ...options: FieldOptions<any, z.infer<T>>[]) {
  return zodType;
}

