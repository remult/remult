import { dbLoader, inputLoader, jsonLoader } from "../column-interfaces";

export const DateOnlyDateDbLoader: dbLoader<Date> = {
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

    }
}
export const CharDateLoader: dbLoader<Date> = {
    toDb: (d: Date) => {
        let val = DateOnlyJsonLoader.toJson(d);
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

export const DateTimeJsonLoader: jsonLoader<Date> = {
    toJson: (val: Date) => {
        if (!val)
            return '';
        var d = val as Date;
        return d.toISOString();
    },
    fromJson: (val: string) => {
        if (val == undefined)
            return undefined;
        if (val == '')
            return undefined;
        if (val.startsWith('0000-00-00'))
            return undefined;
        return new Date(Date.parse(val));
    }
}
export const DateOnlyJsonLoader: jsonLoader<Date> = {
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
    }
}
export const DateDisplayValue = (value: Date) => {
    if (!value)
        return '';
    return value.toLocaleDateString(undefined, { timeZone: 'UTC' })
}

export const BoolDbLoader: dbLoader<Boolean> = {
    toDb: (val: boolean) => val,
    fromDb: (value: any) => {
        return BoolJsonLoader.fromJson(value);
    }
}
export const BoolJsonLoader: jsonLoader<Boolean> = {
    fromJson: value => {
        if (typeof value === "boolean")
            return value;
        if (value !== undefined) {
            return value.toString().trim().toLowerCase() == 'true';
        }
        return undefined;
    },
    toJson: x => x
}
export const NumberDbLoader: dbLoader<Number> = {
    fromDb: value => {
        if (value !== undefined)
            return +value;
        return undefined;
    },
    toDb: value => value
}
export const NumberInputLoader: inputLoader<number> = {
    fromInput: x => {
        let r = +x;
        if (!x)
            return undefined;
        
        if (x.trim() == '-')
            return -0.00000001;
        if (isNaN(r))
            return 0;
        return r;
    },
    toInput: x => {
        if (x == -0.00000001)
            return "-";
        return x.toString();
    }
}