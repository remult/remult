import { Allowed, EntityAllowed } from './context';
import { EntityColumn, ColumnDefinitionsOf, ClassType } from './remult3';




export interface dbLoader<valueType> {
    toDb(val: valueType): any;
    fromDb(val: any): valueType;
}
export interface jsonLoader<valueType> {
    toJson(val: valueType): any;
    fromJson(val: any): valueType;
}
export interface inputLoader<valueType> {
    toInput(val: valueType): string;
    fromInput(val: string): valueType;
}



export interface ColumnSettings<valueType = any, entityType = any> {
    key?: string;
    target?: ClassType<entityType>;
    dataType?: any;

    
    caption?: string;
    displayValue?: (entity: entityType, value: valueType) => string;
    defaultValue?: (entity: entityType) => valueType | Promise<valueType>;
    validate?: ColumnValidator<valueType, entityType> | ColumnValidator<valueType, entityType>[];
    inputType?: string;
    allowNull?: boolean;

    dbName?: string;
    sqlExpression?: string | ((entity: ColumnDefinitionsOf<entityType>) => string);
    serverExpression?: (entity: entityType) => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    dbLoader?: dbLoader<valueType>;
    jsonLoader?: jsonLoader<valueType>;
    inputLoader?: inputLoader<valueType>;
    dbType?: string;
    
    includeInApi?: Allowed;
    allowApiUpdate?: EntityAllowed<entityType>;
}
export interface ColumnDefinitions<T = any> {
    readonly key: string;
    readonly target: ClassType<any>;
    readonly dataType: any;

    readonly caption: string;
    readonly inputType: string;
    readonly allowNull: boolean;
    
    
    readonly isServerExpression: boolean;
    readonly dbReadOnly: boolean;
    readonly dbName: string;
    
    readonly dbLoader: dbLoader<T>;
    readonly jsonLoader: jsonLoader<T>;
    readonly inputLoader: inputLoader<T>;
    readonly dbType: string;
    
    
    
    
    readonly readonly: boolean;//to be removed

}
export interface ValueConverter<T>{
    fromJson(val:any):T
    toJson(val:T):any;
    fromDb(val:any):T
    toDb(val:T):any;
    readonly columnTypeInDb:string;
    toInput(val:T,inputType:string):string;
    fromInput(val:T,inputType:string):string;
    

}

export declare type ColumnValidator<valueType = any, entityType = any> = (entity: entityType, col: EntityColumn<valueType, entityType>) => void | Promise<void>;

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


