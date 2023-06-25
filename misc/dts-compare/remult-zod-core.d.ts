import { ZodObject, ZodRawShape, infer as zInfer, ZodType } from 'zod';
import { FieldOptions } from './src/column-interfaces';
import { EntityInfoProvider } from './src/context';
import { EntityOptions } from './src/entity';
import { MemberType } from './src/remult3';
export declare function zodEntity<zodType extends ZodRawShape>(key: string, zodType: ZodObject<zodType>, options: EntityOptions<zInfer<ZodObject<zodType>>>): ZodObject<zodType> & EntityInfoProvider<zInfer<ZodObject<zodType>>>;
export declare function zodField<zodType extends ZodType>(zodType: zodType, ...options: (FieldOptions<any, zInfer<zodType>> | MemberType<InstanceType<zInfer<zodType>>>)[]): zodType;
