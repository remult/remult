import type { ClassType } from '../classType';
import type { FieldMetadata, FieldOptions, ValueConverter } from './column-interfaces';
import type { EntityFilter } from './remult3/remult3';
export declare class CompoundIdField implements FieldMetadata<string> {
    fields: FieldMetadata[];
    constructor(...columns: FieldMetadata[]);
    apiUpdateAllowed(item: any): boolean;
    displayValue(item: any): string;
    includedInApi: boolean;
    toInput(value: string, inputType?: string): string;
    fromInput(inputValue: string, inputType?: string): string;
    getDbName(): Promise<string>;
    getId(instance: any): string;
    options: FieldOptions<any, any>;
    get valueConverter(): Required<ValueConverter<string>>;
    target: ClassType<any>;
    readonly: true;
    allowNull: boolean;
    dbReadOnly: boolean;
    isServerExpression: boolean;
    key: string;
    caption: string;
    inputType: string;
    dbName: string;
    valueType: any;
    isEqualTo(value: FieldMetadata<string> | string): EntityFilter<any>;
}
