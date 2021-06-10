import { FieldDefinitions } from "../column-interfaces";
import { comparableFilterItem, EntityDefinitions, EntityWhere, filterOf, filterOptions, getEntitySettings, sortOf, supportsContains } from "../remult3";


export class Filter {
    constructor(private apply?: (add: FilterConsumer) => void) {
        if (!this.apply) {
            this.apply = () => { };
        }
    }
    __applyToConsumer(add: FilterConsumer) {
        this.apply(add);
    }
    and(filter: Filter): Filter {
        return new AndFilter(this, filter);
    }
    or(filter: Filter): Filter {
        return new OrFilter(this, filter);
    }
    static createFilterOf<T>(entityDefs: EntityDefinitions<T>): filterOf<T> {
        let r = {};
        for (const c of entityDefs.fields) {
            r[c.key] = new filterHelper(c);
        }
        return r as filterOf<T>;
    }
    static translateWhereToFilter<T>(entity: filterOf<T>, where: EntityWhere<T>): Filter {
        if (Array.isArray(where)) {
            return new AndFilter(...where.map(x =>
                Filter.translateWhereToFilter(entity, x)
            ));
        }
        else if (typeof where === 'function') {
            let r = where(entity);
            if (Array.isArray(r))
                return new AndFilter(
                    //@ts-ignore
                    ...r.map(x => {
                    if (typeof x === "function")
                        return this.translateWhereToFilter(entity, x);
                    return x
                }));
            else if (typeof r === 'function')
                return this.translateWhereToFilter(entity, r);
            return r;
        }
    }
    static packWhere<T>(entityDefs: EntityDefinitions<T>, where: EntityWhere<T>) {
        if (!where)
            return {};
        return packToRawWhere(this.translateWhereToFilter(this.createFilterOf(entityDefs), where));

    }
    static unpackWhere<T>(entityDefs: EntityDefinitions<T>, packed: any): Filter {
        return this.extractWhere(entityDefs, { get: (key: string) => packed[key] });

    }
    static extractWhere<T>(entityDefs: EntityDefinitions<T>, filterInfo: { get: (key: string) => any; }): Filter {
        return extractWhere([...entityDefs.fields], filterInfo);
    }

}
export class filterHelper implements filterOptions<any>, comparableFilterItem<any>, supportsContains<any>  {
    constructor(private col: FieldDefinitions) {

    }
    processVal(val: any) {
        let ei = getEntitySettings(this.col.dataType, false);
        if (ei) {
            if (!val)
                return null;
            if (typeof val === "string" || typeof val === "number")
                return val;
            return val.id;
        }
        return val;
    }
    startsWith(val: any): Filter {
        return new Filter(add => add.startsWith(this.col, val));
    }

    contains(val: string): Filter {
        return new Filter(add => add.containsCaseInsensitive(this.col, val));

    }
    isLessThan(val: any): Filter {
        return new Filter(add => add.isLessThan(this.col, val));
    }
    isGreaterOrEqualTo(val: any): Filter {
        return new Filter(add => add.isGreaterOrEqualTo(this.col, val));
    }
    isNotIn(values: any[]): Filter {
        return new Filter(add => {
            for (const v of values) {
                add.isDifferentFrom(this.col, v);
            }
        });
    }
    isDifferentFrom(val: any) {
        val = this.processVal(val);
        if (val === null && this.col.allowNull)
            return new Filter(add => add.isNotNull(this.col));
        return new Filter(add => add.isDifferentFrom(this.col, val));
    }
    isLessOrEqualTo(val: any): Filter {
        return new Filter(add => add.isLessOrEqualTo(this.col, val));
    }
    isGreaterThan(val: any): Filter {
        return new Filter(add => add.isGreaterThan(this.col, val));
    }
    isEqualTo(val: any): Filter {
        val = this.processVal(val);
        if (val === null && this.col.allowNull)
            return new Filter(add => add.isNull(this.col));
        return new Filter(add => add.isEqualTo(this.col, val));
    }
    isIn(val: any[]): Filter {
        val = val.map(x => this.processVal(x));
        return new Filter(add => add.isIn(this.col, val));
    }

}
export interface FilterConsumer {
    or(orElements: Filter[]);
    isEqualTo(col: FieldDefinitions, val: any): void;
    isDifferentFrom(col: FieldDefinitions, val: any): void;
    isNull(col: FieldDefinitions): void;
    isNotNull(col: FieldDefinitions): void;
    isGreaterOrEqualTo(col: FieldDefinitions, val: any): void;
    isGreaterThan(col: FieldDefinitions, val: any): void;
    isLessOrEqualTo(col: FieldDefinitions, val: any): void;
    isLessThan(col: FieldDefinitions, val: any): void;
    containsCaseInsensitive(col: FieldDefinitions, val: any): void;
    startsWith(col: FieldDefinitions, val: any): void;
    isIn(col: FieldDefinitions, val: any[]): void;
}


export class AndFilter extends Filter {

    constructor(...filters: Filter[]) {
        super(add => {
            for (const iterator of filters) {
                if (iterator)
                    iterator.__applyToConsumer(add);
            }
        });
    }
}
export class OrFilter extends Filter {

    constructor(...filters: Filter[]) {
        super(add => {
            let f = filters.filter(x => x !== undefined);
            if (f.length > 1) {
                add.or(f);
            }
            else if (f.length == 1)
                f[0].__applyToConsumer(add);
        });
    }
}



export class FilterSerializer implements FilterConsumer {
    result: any = {};
    constructor() {

    }
    hasUndefined = false;
    add(key: string, val: any) {
        if (val === undefined)
            this.hasUndefined = true;
        let r = this.result;
        if (!r[key]) {
            r[key] = val;
            return;
        }
        let v = r[key];
        if (v instanceof Array) {
            v.push(val);
        }
        else
            v = [v, val];
        r[key] = v;
    }

    or(orElements: Filter[]) {
        this.add("OR", orElements.map(x => {
            let f = new FilterSerializer();
            x.__applyToConsumer(f);
            return f.result;
        }));
    }
    isNull(col: FieldDefinitions): void {
        this.add(col.key + "_null", true);
    }
    isNotNull(col: FieldDefinitions): void {
        this.add(col.key + "_null", false);
    }
    isIn(col: FieldDefinitions, val: any[]): void {
        this.add(col.key + "_in", val.map(x => col.valueConverter.toJson(x)));
    }

    public isEqualTo(col: FieldDefinitions, val: any): void {
        this.add(col.key, col.valueConverter.toJson(val));
    }

    public isDifferentFrom(col: FieldDefinitions, val: any): void {
        this.add(col.key + '_ne', col.valueConverter.toJson(val));
    }

    public isGreaterOrEqualTo(col: FieldDefinitions, val: any): void {
        this.add(col.key + '_gte', col.valueConverter.toJson(val));
    }

    public isGreaterThan(col: FieldDefinitions, val: any): void {
        this.add(col.key + '_gt', col.valueConverter.toJson(val));
    }

    public isLessOrEqualTo(col: FieldDefinitions, val: any): void {
        this.add(col.key + '_lte', col.valueConverter.toJson(val));
    }

    public isLessThan(col: FieldDefinitions, val: any): void {
        this.add(col.key + '_lt', col.valueConverter.toJson(val));
    }
    public containsCaseInsensitive(col: FieldDefinitions, val: any): void {
        this.add(col.key + "_contains", col.valueConverter.toJson(val));
    }
    public startsWith(col: FieldDefinitions, val: any): void {
        this.add(col.key + "_st", col.valueConverter.toJson(val));
    }
}

export function unpackWhere(columns: FieldDefinitions[], packed: any) {
    return extractWhere(columns, { get: (key: string) => packed[key] });
}
export function extractWhere(columns: FieldDefinitions[], filterInfo: {
    get: (key: string) => any;
}) {
    let where: Filter = undefined;
    columns.forEach(col => {
        function addFilter(operation: string, theFilter: (val: any) => Filter, jsonArray = false) {
            let val = filterInfo.get(col.key + operation);
            if (val !== undefined) {
                let addFilter = (val: any) => {
                    let theVal = val;
                    if (jsonArray) {
                        let arr: [];
                        if (typeof val === 'string')
                            arr = JSON.parse(val);
                        else
                            arr = val;
                        theVal = arr.map(x => col.valueConverter.fromJson(x));
                    } else {
                        theVal = col.valueConverter.fromJson(theVal);
                    }
                    let f = theFilter(theVal);
                    if (f) {
                        if (where)
                            where = new AndFilter(where, f);
                        else
                            where = f;
                    }
                };
                if (!jsonArray && val instanceof Array) {
                    val.forEach(v => {
                        addFilter(v);
                    });
                }
                else
                    addFilter(val);
            }
        }
        let c = new filterHelper(col);
        addFilter('', val => c.isEqualTo(val));
        addFilter('_gt', val => c.isGreaterThan(val));
        addFilter('_gte', val => c.isGreaterOrEqualTo(val));
        addFilter('_lt', val => c.isLessThan(val));
        addFilter('_lte', val => c.isLessOrEqualTo(val));
        addFilter('_ne', val => c.isDifferentFrom(val));
        addFilter('_in', val =>
            c.isIn(val), true);
        addFilter('_null', val => {
            val = val.toString().trim().toLowerCase();
            switch (val) {
                case "y":
                case "true":
                case "yes":
                    return c.isEqualTo(null);
                default:
                    return c.isDifferentFrom(null);
            }
        });
        addFilter('_contains', val => {

            return c.contains(val);

        });
        addFilter('_st', val => {
            return c.startsWith(val);
        });
    });
    let val = filterInfo.get('OR');
    if (val)
        where = new AndFilter(where, new OrFilter(...val.map(x =>
            unpackWhere(columns, x)

        )))
    return where;
}


export function packToRawWhere(w: Filter) {
    let r = new FilterSerializer();
    if (w)
        w.__applyToConsumer(r);
    return r.result;
}
