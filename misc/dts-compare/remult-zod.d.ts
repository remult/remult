import { infer as zInfer, ZodType } from 'zod';
import { FieldOptions } from './src/column-interfaces';
import { MemberType } from './src/remult3';
export declare function zodField<zodType extends ZodType>(zodType: zodType, ...options: (FieldOptions<any, zInfer<zodType>> | MemberType<InstanceType<zInfer<zodType>>>)[]): zodType;
