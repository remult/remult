import { ValueConverter } from "../column-interfaces";
import { InputTypes } from "../remult3";




export const DateValueConverter: ValueConverter<Date> = {
    toJson: (val: Date) => {
        if (!val)
            return '';
        if (val instanceof Date) {
            return val.toISOString();
        }
        else {
            console.log("ToJsonError", val);
            throw new Error("Expected date but got val");
        }

    },
    fromJson: (val: string) => {
        if (val == undefined)
            return undefined;
        if (val == '')
            return undefined;
        if (val.startsWith('0000-00-00'))
            return undefined;
        return new Date(Date.parse(val));
    },
    toDb: x => x,
    fromDb: x => x,
    fromInput: x => DateValueConverter.fromJson(x),
    toInput: x => DateValueConverter.toJson(x),
    displayValue: (val) => {
        if (!val)
            return '';
        return val.toLocaleString();
    }
}

export const DateOnlyValueConverter: ValueConverter<Date> = {
    fromInput: x => DateOnlyValueConverter.fromJson(x),
    toInput: x => DateOnlyValueConverter.toJson(x),
    toJson: (val: Date) => {
        var d = val as Date;
        if (!d)
            return '';
        return d.toISOString().substring(0, 10);
    },
    fromJson: (value: string) => {
        if (!value || value == '' || value == '0000-00-00')
            return undefined;
        return new Date(Date.parse(value));
    },
    inputType: InputTypes.date,
    toDb: (val: Date) => {

        if (!val)
            return undefined;
        return new Date(val.valueOf() + val.getTimezoneOffset() * 60000);

    }//when using date storage,  the database expects and returns a date local and every where else we reflect on date iso
    , fromDb: (val: Date) => {
        var d = val as Date;
        if (!d)
            return undefined;
        return new Date(val.valueOf() - val.getTimezoneOffset() * 60000);

    },
    columnTypeInDb: 'date',
    displayValue: (value: Date) => {
        if (!value)
            return '';
        return value.toLocaleDateString(undefined, { timeZone: 'UTC' })
    }
}
export const CharDateValueConverter: ValueConverter<Date> = {
    ...DateOnlyValueConverter,
    toDb: (d: Date) => {
        let val = DateOnlyValueConverter.toJson(d);
        if (!val)
            return undefined;
        return val.replace(/-/g, '');

    }
    , fromDb: (val: string) => {
        if (!val)
            return undefined;
        return new Date(val.substring(0, 4) + '-' + val.substring(4, 6) + '-' + val.substring(6, 8));
    }
}


export const BoolValueConverter: ValueConverter<Boolean> = {
    toDb: (val: boolean) => val,
    inputType: InputTypes.checkbox,
    fromDb: (value: any) => {
        return BoolValueConverter.fromJson(value);
    },
    fromJson: value => {
        if (typeof value === "boolean")
            return value;
        if (value !== undefined) {
            return value.toString().trim().toLowerCase() == 'true';
        }
        return undefined;
    },
    toJson: x => x,
    fromInput: x => BoolValueConverter.fromJson(x),
    toInput: x => BoolValueConverter.toJson(x)
}

export const IntValueConverter: ValueConverter<number> =
{

    fromDb: value => {
        if (value !== undefined)
            return +value;
        return undefined;
    },
    toDb: value => value,
    fromJson: value => IntValueConverter.fromDb(value),
    toJson: value => IntValueConverter.toDb(value),
    fromInput: (x, type) => {
        let r = +x;
        if (!x)
            return undefined;

        if (x.trim() == '-')
            return -0.00000001;
        if (isNaN(r))
            return 0;
        return r;
    },
    toInput: (x, type) => {
        if (x == -0.00000001)
            return "-";
        return x.toString();
    },
    inputType: InputTypes.number
}
export const DecimalValueConverter: ValueConverter<Number> =
{
    ...IntValueConverter,
    columnTypeInDb: 'decimal'
}
export const DefaultValueConverter: ValueConverter<any> = {
    fromJson: x => x,
    toJson: x => x,
    fromDb: x => DefaultValueConverter.fromJson(x),
    toDb: x => DefaultValueConverter.toJson(x),
    fromInput: x => DefaultValueConverter.fromJson(x),
    toInput: x => DefaultValueConverter.toJson(x)
}
export class StoreAsStringValueConverter<T> implements ValueConverter<T>{
    constructor(public _toJson: (x: T) => string, public _fromJson: (x: string) => T) {

    }
    fromJson(val: any): T {
        return this._fromJson(val);
    }
    toJson(val: T) {
        if (val === undefined)
            return undefined;
        return this._toJson(val);
    }
    fromDb(val: any): T {
        return this.fromJson(val);
    }
    toDb(val: T) {
        return this.toJson(val);
    }
    toInput(val: T, inputType: string): string {
        return this.toJson(val);
    }
    fromInput(val: string, inputType: string): T {
        return this.fromJson(val);
    }
    displayValue?(val: T): string {
        return this.toJson(val);
    }
    columnTypeInDb?: string;
    inputType?: string;

}