import { Allowed, Context, EntityAllowed } from './context';
import { EntityField, FieldDefinitionsOf, ClassType, EntityDefinitions } from './remult3';








export interface FieldSettings<valueType = any, entityType = any> {
    key?: string;
    target?: ClassType<entityType>;
    dataType?: any;


    caption?: string | ((context: Context) => string);
    displayValue?: (entity: entityType, value: valueType) => string;
    defaultValue?: (entity: entityType, context: Context) => valueType | Promise<valueType>;
    validate?: FieldValidator<valueType, entityType> | FieldValidator<valueType, entityType>[];
    inputType?: string;
    allowNull?: boolean;

    dbName?: string;
    sqlExpression?: string | ((entity: EntityDefinitions<entityType>, context: Context) => string);
    serverExpression?: (entity: entityType) => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    valueConverter?: (context: Context) => ValueConverter<valueType>;

    includeInApi?: Allowed;
    allowApiUpdate?: EntityAllowed<entityType>;
}
export interface FieldDefinitions<T = any> {
    readonly key: string;
    readonly target: ClassType<T>;
    readonly dataType: any;

    readonly caption: string;
    readonly inputType: string;
    readonly allowNull: boolean;


    readonly isServerExpression: boolean;
    readonly dbReadOnly: boolean;
    readonly dbName: string;
    readonly valueConverter: ValueConverter<T>;
    readonly evilOriginalSettings: FieldSettings;

}
export interface ValueConverter<T> {
    fromJson(val: any): T;
    toJson(val: T): any;
    fromDb(val: any): T
    toDb(val: T): any;
    toInput(val: T, inputType: string): string;
    fromInput(val: string, inputType: string): T;
    displayValue?(val: T): string;
    readonly fieldTypeInDb?: string;
    readonly inputType?: string;


}

export declare type FieldValidator<valueType = any, entityType = any> = (entity: entityType, col: EntityField<valueType, entityType>) => void | Promise<void>;

export declare type ValueOrExpression<valueType> = valueType | (() => valueType);


export function valueOrExpressionToValue<T>(f: ValueOrExpression<T>): T {
    if (typeof f === 'function') {
        let x = f as any;
        return x();
    }
    return <T>f;
}







export interface ValueListItem {
    id?: any;
    caption?: any;
}


