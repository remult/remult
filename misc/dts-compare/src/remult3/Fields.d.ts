import type { ClassType } from '../../classType';
import type { FieldOptions } from '../column-interfaces';
import type { Remult } from '../context';
import type { RelationOptions } from './remult3';
import { type ClassFieldDecoratorContextStub } from './RepositoryImplementation';
export declare class Fields {
    /**
     * Stored as a JSON.stringify - to store as json use Fields.json
     */
    static object<entityType = any, valueType = any>(...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, valueType | undefined>, c?: any) => void;
    static json<entityType = any, valueType = any>(...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, valueType | undefined>, c?: any) => void;
    static dateOnly<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static date<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static integer<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, number | undefined>, c?: any) => void;
    static autoIncrement<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, number | undefined>, c?: any) => void;
    static number<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, number | undefined>, c?: any) => void;
    static createdAt<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static updatedAt<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static uuid<entityType = any>(...options: (FieldOptions<entityType, string> | ((options: FieldOptions<entityType, string>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, string | undefined>, c?: any) => void;
    static cuid<entityType = any>(...options: (FieldOptions<entityType, string> | ((options: FieldOptions<entityType, string>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, string | undefined>, c?: any) => void;
    static string<entityType = any>(...options: (StringFieldOptions<entityType> | ((options: StringFieldOptions<entityType>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, string | undefined>, c?: any) => void;
    static boolean<entityType = any>(...options: (FieldOptions<entityType, boolean> | ((options: FieldOptions<entityType, boolean>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, boolean | undefined>, c?: any) => void;
    static toMany<entityType, toEntityType>(entity: ClassType<entityType>, toEntityType: () => ClassType<toEntityType>, options: RelationOptions<entityType, toEntityType, toEntityType> | keyof toEntityType): (target: any, context: string | ClassFieldDecoratorContextStub<any, any>, c?: any) => void;
    static toOne<entityType, toEntityType>(entity: ClassType<entityType>, toEntityType: () => ClassType<toEntityType>, options?: RelationOptions<entityType, toEntityType, entityType> | keyof entityType): (target: any, context: string | ClassFieldDecoratorContextStub<any, any>, c?: any) => void;
}
/**Decorates fields that should be used as fields.
 * for more info see: [Field Types](https://remult.dev/docs/field-types.html)
 *
 * FieldOptions can be set in two ways:
 * @example
 * // as an object
 * @Fields.string({ includeInApi:false })
 * title='';
 * @example
 * // as an arrow function that receives `remult` as a parameter
 * @Fields.string((options,remult) => options.includeInApi = true)
 * title='';
 */
export declare function Field<entityType = any, valueType = any>(valueType: () => ClassType<valueType>, ...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, context: ClassFieldDecoratorContextStub<entityType, valueType | undefined> | string, c?: any) => void;
export interface StringFieldOptions<entityType = any> extends FieldOptions<entityType, string> {
    maxLength?: number;
}
export declare function checkTarget(target: any): void;
