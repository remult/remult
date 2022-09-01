import { ValueConverter } from "./column-interfaces.js";
export declare class ValueConverters {
    static readonly Date: ValueConverter<Date>;
    static readonly DateOnly: ValueConverter<Date>;
    static readonly DateOnlyString: ValueConverter<Date>;
    static readonly Boolean: ValueConverter<Boolean>;
    static readonly Number: ValueConverter<number>;
    static readonly Integer: ValueConverter<number>;
    static readonly Default: ValueConverter<any>;
    static readonly JsonString: ValueConverter<any>;
    static readonly JsonValue: ValueConverter<any>;
}
