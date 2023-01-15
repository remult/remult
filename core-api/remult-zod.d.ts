import * as z from 'zod';
import { ZodObject, ZodRawShape } from 'zod';
import { FieldOptions } from './src/column-interfaces';
import { EntityInfoProvider } from './src/context';
import { EntityOptions } from './src/entity';
import { MemberType } from './src/remult3';
export declare function zodEntity<zodType extends ZodRawShape>(key: string, zodType: ZodObject<zodType>, options: EntityOptions<zodType>): ZodObject<zodType> & EntityInfoProvider<z.infer<ZodObject<zodType>>>;
export declare function zodField<zodType extends z.ZodType>(zodType: zodType, ...options: (FieldOptions<any, z.infer<zodType>> | MemberType<InstanceType<z.infer<zodType>>>)[]): zodType;
