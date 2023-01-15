import * as z from 'zod';
import { ZodObject, ZodRawShape } from 'zod';
import { FieldOptions } from './src/column-interfaces';
import { EntityInfoProvider } from './src/context';
import { EntityOptions } from './src/entity';
export declare function zodEntity<T extends ZodRawShape>(key: string, z: ZodObject<T>, options: EntityOptions<T>): ZodObject<T> & EntityInfoProvider<z.infer<ZodObject<T>>>;
export declare function zodField<T extends z.ZodType>(zodType: T, ...options: FieldOptions<any, z.infer<T>>[]): T;
