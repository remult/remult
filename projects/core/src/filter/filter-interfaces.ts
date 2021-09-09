import { FieldMetadata } from "../column-interfaces";
import { Remult } from "../context";
import { ComparisonFilterFactory, EntityMetadata, EntityFilter, FilterFactories, FilterFactory, getEntityRef, getEntitySettings, SortSegments, ContainsFilterFactory, EntityFilterItem } from "../remult3";


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
    static createFilterFactories<T>(entityDefs: EntityMetadata<T>): FilterFactories<T> {
        let r = {};
        for (const c of entityDefs.fields) {
            r[c.key] = new filterHelper(c);
        }
        return r as FilterFactories<T>;
    }
    static toItem<entityType>(...where: EntityFilter<entityType>[]) {
        return async entityFilterFactory => {
            return new AndFilter(...(await Promise.all(where.map(w => Filter.translateWhereToFilter(entityFilterFactory, w)))));
        }
    }
    static async translateWhereToFilter<T>(entity: FilterFactories<T>, where: EntityFilter<T>): Promise<Filter> {
        if (Array.isArray(where)) {
            return new AndFilter(...await Promise.all(where.map(x =>
                Filter.translateWhereToFilter(entity, x)
            )));
        }
        else if (typeof where === 'function') {
            let r = where(entity);
            if (Array.isArray(r))
                return new AndFilter(
                    //@ts-ignore
                    ...await Promise.all(r.map(async x => {
                        if (typeof x === "function")
                            return this.translateWhereToFilter(entity, x);
                        return await x
                    })));
            else if (typeof r === 'function')
                return this.translateWhereToFilter(entity, r);

            return r;
        }
    }
    static async packWhere<T>(entityDefs: EntityMetadata<T>, where: EntityFilter<T>) {
        if (!where)
            return {};
        return Filter.packToRawWhere(await this.translateWhereToFilter(this.createFilterFactories(entityDefs), where));

    }
    static packToRawWhere(w: Filter) {
        let r = new FilterSerializer();
        if (w)
            w.__applyToConsumer(r);
        return r.result;
    }
    static unpackWhere<T>(entityDefs: EntityMetadata<T>, packed: any): Filter {
        return this.extractWhere(entityDefs, { get: (key: string) => packed[key] });

    }
    static extractWhere<T>(entityDefs: EntityMetadata<T>, filterInfo: { get: (key: string) => any; }): Filter {
        return extractWhere([...entityDefs.fields], filterInfo);
    }
    static async translateCustomWhere<T>(entity: EntityMetadata<T>, filterFactories: FilterFactories<T>, r: Filter, remult: Remult) {
        let f = new customTranslator(async custom => {
            return await entity.options.customFilterBuilder().translateFilter(filterFactories, custom, remult);
        });
        r.__applyToConsumer(f);
        await f.resolve();
        r = new Filter(x => f.applyTo(x));
        return r;
    }

}
export class filterHelper implements FilterFactory<any>, ComparisonFilterFactory<any>, ContainsFilterFactory<any>  {
    constructor(public metadata: FieldMetadata) {

    }

    processVal(val: any) {
        let ei = getEntitySettings(this.metadata.valueType, false);
        if (ei) {
            if (!val)
                return null;
            if (typeof val === "string" || typeof val === "number")
                return val;
            return getEntityRef(val).getId();
        }
        return val;
    }
    startsWith(val: any): Filter {
        return new Filter(add => add.startsWith(this.metadata, val));
    }

    contains(val: string): Filter {
        return new Filter(add => add.containsCaseInsensitive(this.metadata, val));

    }
    isLessThan(val: any): Filter {
        return new Filter(add => add.isLessThan(this.metadata, val));
    }
    isGreaterOrEqualTo(val: any): Filter {
        return new Filter(add => add.isGreaterOrEqualTo(this.metadata, val));
    }
    isNotIn(values: any[]): Filter {
        return new Filter(add => {
            for (const v of values) {
                add.isDifferentFrom(this.metadata, v);
            }
        });
    }
    isDifferentFrom(val: any) {
        val = this.processVal(val);
        if (val === null && this.metadata.allowNull)
            return new Filter(add => add.isNotNull(this.metadata));
        return new Filter(add => add.isDifferentFrom(this.metadata, val));
    }
    isLessOrEqualTo(val: any): Filter {
        return new Filter(add => add.isLessOrEqualTo(this.metadata, val));
    }
    isGreaterThan(val: any): Filter {
        return new Filter(add => add.isGreaterThan(this.metadata, val));
    }
    isEqualTo(val: any): Filter {
        val = this.processVal(val);
        if (val === null && this.metadata.allowNull)
            return new Filter(add => add.isNull(this.metadata));
        return new Filter(add => add.isEqualTo(this.metadata, val));
    }
    isIn(val: any[]): Filter {
        val = val.map(x => this.processVal(x));
        return new Filter(add => add.isIn(this.metadata, val));
    }

}
export interface FilterConsumer {
    or(orElements: Filter[]);
    isEqualTo(col: FieldMetadata, val: any): void;
    isDifferentFrom(col: FieldMetadata, val: any): void;
    isNull(col: FieldMetadata): void;
    isNotNull(col: FieldMetadata): void;
    isGreaterOrEqualTo(col: FieldMetadata, val: any): void;
    isGreaterThan(col: FieldMetadata, val: any): void;
    isLessOrEqualTo(col: FieldMetadata, val: any): void;
    isLessThan(col: FieldMetadata, val: any): void;
    containsCaseInsensitive(col: FieldMetadata, val: any): void;
    startsWith(col: FieldMetadata, val: any): void;
    isIn(col: FieldMetadata, val: any[]): void;
    custom(customItem: any): void;
    databaseCustom(databaseCustom: any): void;
}


export class AndFilter extends Filter {
    readonly filters: Filter[];
    constructor(...filters: Filter[]) {
        super(add => {
            for (const iterator of this.filters) {
                if (iterator)
                    iterator.__applyToConsumer(add);
            }
        });
        this.filters = filters;
    }
    add(filter: Filter) {
        this.filters.push(filter);
    }

}
export class OrFilter extends Filter {
    readonly filters: Filter[];

    constructor(...filters: Filter[]) {
        super(add => {
            let f = this.filters.filter(x => x !== undefined);
            if (f.length > 1) {
                add.or(f);
            }
            else if (f.length == 1)
                f[0].__applyToConsumer(add);
        });
        this.filters = filters;
    }
}


export const customUrlToken = "_$custom";
export class FilterSerializer implements FilterConsumer {
    result: any = {};
    constructor() {

    }
    databaseCustom(databaseCustom: any): void {
        throw new Error("database custom is not allowed with rest calls.");
    }
    custom(customItem: any): void {
        this.add(customUrlToken, customItem);
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
    isNull(col: FieldMetadata): void {
        this.add(col.key + "_null", true);
    }
    isNotNull(col: FieldMetadata): void {
        this.add(col.key + "_null", false);
    }
    isIn(col: FieldMetadata, val: any[]): void {
        this.add(col.key + "_in", val.map(x => col.valueConverter.toJson(x)));
    }

    public isEqualTo(col: FieldMetadata, val: any): void {
        this.add(col.key, col.valueConverter.toJson(val));
    }

    public isDifferentFrom(col: FieldMetadata, val: any): void {
        this.add(col.key + '_ne', col.valueConverter.toJson(val));
    }

    public isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
        this.add(col.key + '_gte', col.valueConverter.toJson(val));
    }

    public isGreaterThan(col: FieldMetadata, val: any): void {
        this.add(col.key + '_gt', col.valueConverter.toJson(val));
    }

    public isLessOrEqualTo(col: FieldMetadata, val: any): void {
        this.add(col.key + '_lte', col.valueConverter.toJson(val));
    }

    public isLessThan(col: FieldMetadata, val: any): void {
        this.add(col.key + '_lt', col.valueConverter.toJson(val));
    }
    public containsCaseInsensitive(col: FieldMetadata, val: any): void {
        this.add(col.key + "_contains", val);
    }
    public startsWith(col: FieldMetadata, val: any): void {
        this.add(col.key + "_st", col.valueConverter.toJson(val));
    }
}

export function unpackWhere(columns: FieldMetadata[], packed: any) {
    return extractWhere(columns, { get: (key: string) => packed[key] });
}
export function extractWhere(columns: FieldMetadata[], filterInfo: {
    get: (key: string) => any;
}) {
    let where: Filter[] = [];

    columns.forEach(col => {
        function addFilter(operation: string, theFilter: (val: any) => Filter, jsonArray = false, asString = false) {
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
                        theVal = arr.map(x => asString ? x : col.valueConverter.fromJson(x));
                    } else {
                        theVal = asString ? theVal : col.valueConverter.fromJson(theVal);
                    }
                    let f = theFilter(theVal);
                    if (f) {
                        where.push(f);
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

        }, false, true);
        addFilter('_st', val => {
            return c.startsWith(val);
        });
    });
    let val = filterInfo.get('OR');
    if (val)
        where.push(new OrFilter(...val.map(x =>
            unpackWhere(columns, x)

        )));
    let custom = filterInfo.get(customUrlToken);
    if (custom !== undefined) {
        if (!Array.isArray(custom))
            custom = [custom];
        where.push(...custom.map(y => new Filter(x => x.custom(y))));
    }
    return new AndFilter(...where);
}




export class CustomFilterBuilder<entityType, customFilterObject> {
    constructor(public readonly translateFilter: (entityType: FilterFactories<entityType>, customFilter: customFilterObject, remult: Remult) => Filter | Filter[] | Promise<Filter | Filter[]>) {

    }
    build(custom: customFilterObject): Filter {
        return new Filter(x => x.custom(custom));
    }
}

class customTranslator implements FilterConsumer {
    applyTo(x: FilterConsumer): void {
        this.commands.forEach(y => y(x));
    }
    constructor(private translateCustom: (custom: any) => Promise<Filter | Filter[]>) { }

    commands: ((x: FilterConsumer) => void)[] = [];
    promises: Promise<void>[] = [];
    or(orElements: Filter[]) {
        let newOrElements: Filter[];
        this.promises.push(Promise.all(orElements.map(async element => {
            let c = new customTranslator(this.translateCustom);
            element.__applyToConsumer(c);
            await c.resolve();
            return new Filter(x => c.applyTo(x));
        })).then(x => {
            newOrElements = x;
        }));
        this.commands.push(x => x.or(newOrElements));
    }
    isEqualTo(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.isEqualTo(col, val));
    }
    isDifferentFrom(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.isDifferentFrom(col, val));
    }
    isNull(col: FieldMetadata<any>): void {
        this.commands.push(x => x.isNull(col));
    }
    isNotNull(col: FieldMetadata<any>): void {
        this.commands.push(x => x.isNotNull(col));
    }
    isGreaterOrEqualTo(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.isGreaterOrEqualTo(col, val));
    }
    isGreaterThan(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.isGreaterThan(col, val));
    }
    isLessOrEqualTo(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.isLessOrEqualTo(col, val));
    }
    isLessThan(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.isLessThan(col, val));
    }
    containsCaseInsensitive(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.containsCaseInsensitive(col, val));
    }
    startsWith(col: FieldMetadata<any>, val: any): void {
        this.commands.push(x => x.startsWith(col, val));
    }
    isIn(col: FieldMetadata<any>, val: any[]): void {
        this.commands.push(x => x.isIn(col, val));
    }
    custom(customItem: any): void {
        this.promises.push(
            (async () => {
                let r = await this.translateCustom(customItem);
                if (r)
                    if (Array.isArray(r))
                        r.forEach(x => x.__applyToConsumer(this));
                    else
                        r.__applyToConsumer(this);
            })()
        )

    }
    databaseCustom(custom: any) {
        this.commands.push(x => x.databaseCustom(custom));
    }
    async resolve() {
        while (this.promises.length > 0) {
            let p = this.promises;
            this.promises = [];
            await Promise.all(p);
        }
    }

}