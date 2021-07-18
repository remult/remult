
import { FieldMetadata, FieldOptions, ValueListItem } from "../column-interfaces";
import { EntityOptions } from "../entity";
import { CompoundIdField, LookupColumn, makeTitle } from '../column';
import { EntityMetadata, FieldRef, Fields, EntityWhere, FindOptions, Repository, EntityRef, IterateOptions, IterableResult, EntityOrderBy, FieldsMetadata, IdMetadata, FindFirstOptionsBase, FindFirstOptions } from "./remult3";
import { ClassType } from "../../classType";
import { allEntities, Context, iterateConfig, IterateToArrayOptions, setControllerSettings } from "../context";
import { AndFilter, Filter, FilterConsumer, OrFilter } from "../filter/filter-interfaces";
import { Sort } from "../sort";


import { entityEventListener } from "../__EntityValueProvider";
import { DataProvider, EntityDataProvider, EntityDataProviderFindOptions, ErrorInfo } from "../data-interfaces";
import { BoolValueConverter, DateOnlyValueConverter, DateValueConverter, NumberValueConverter, DefaultValueConverter, IntegerValueConverter, ValueListValueConverter } from "../../valueConverters";


export class RepositoryImplementation<entityType> implements Repository<entityType>{
    createAfterFilter(orderBy: EntityOrderBy<entityType>, lastRow: entityType): EntityWhere<entityType> {
        let values = new Map<string, any>();

        for (const s of Sort.translateOrderByToSort(this.metadata, orderBy).Segments) {
            values.set(s.field.key, lastRow[s.field.key]);
        }
        return x => {
            let r: Filter = undefined;
            let equalToColumn: FieldMetadata[] = [];
            for (const s of Sort.translateOrderByToSort(this.metadata, orderBy).Segments) {
                let f: Filter;
                for (const c of equalToColumn) {
                    f = new AndFilter(f, new Filter(x => x.isEqualTo(c, values.get(c.key))));
                }
                equalToColumn.push(s.field);
                if (s.isDescending) {
                    f = new AndFilter(f, new Filter(x => x.isLessThan(s.field, values.get(s.field.key))));
                }
                else
                    f = new AndFilter(f, new Filter(x => x.isGreaterThan(s.field, values.get(s.field.key))));
                r = new OrFilter(r, f);
            }
            return r;
        }
    }

    private _info: EntityFullInfo<entityType>;
    private __edp: EntityDataProvider;
    private get edp() {
        return this.__edp ? this.__edp : this.__edp = this.dataProvider.getEntityDataProvider(this.metadata);
    }
    constructor(private entity: ClassType<entityType>, private context: Context, private dataProvider: DataProvider) {
        this._info = createOldEntity(entity, context);
    }
    idCache = new Map<any, any>();
    getCachedById(id: any): entityType {
        this.getCachedByIdAsync(id);
        let r = this.idCache.get(id);
        if (r instanceof Promise)
            return undefined;
        return r;
    }
    async getCachedByIdAsync(id: any): Promise<entityType> {

        let r = this.idCache.get(id);
        if (r instanceof Promise)
            return await r;
        if (this.idCache.has(id)) {
            return r;
        }
        this.idCache.set(id, undefined);
        let row = this.findId(id).then(row => {
            if (row === undefined) {
                r = null;
            }
            else
                r = row;
            this.idCache.set(id, r);
            return r;
        });
        this.idCache.set(id, row);
        return await row;
    }
    addToCache(item: entityType) {
        if (item)
            this.idCache.set(this.getEntityRef(item).getId(), item);
    }


    get metadata(): EntityMetadata<entityType> { return this._info };


    listeners: entityEventListener<entityType>[];
    addEventListener(listener: entityEventListener<entityType>) {
        if (!this.listeners)
            this.listeners = []
        this.listeners.push(listener);
        return () => {
            this.listeners.splice(this.listeners.indexOf(listener), 1);
        }
    }



    iterate(options?: EntityWhere<entityType> | IterateOptions<entityType>): IterableResult<entityType> {
        let opts: IterateOptions<entityType> = {};
        if (options) {
            if (typeof options === 'function')
                opts.where = <any>options;
            else
                opts = <any>options;
        }

        let cont = this;
        let _count: number;
        let self = this;
        let r = new class {

            async toArray(options?: IterateToArrayOptions) {
                if (!options) {
                    options = {};
                }


                return cont.find({
                    where: opts.where,
                    orderBy: opts.orderBy,
                    limit: options.limit,
                    page: options.page,
                    load: opts.load
                });
            }
            async first() {
                let r = await cont.find({
                    where: opts.where,
                    orderBy: opts.orderBy,
                    load: opts.load,
                    limit: 1
                });
                if (r.length == 0)
                    return undefined;
                return r[0];
            }

            async count() {
                if (_count === undefined)
                    _count = await cont.count(opts.where);
                return _count;

            }
            async forEach(what: (item: entityType) => Promise<any>) {
                let i = 0;
                for await (const x of this) {
                    await what(x);
                    i++;
                }
                return i;
            }

            //@ts-ignore
            [Symbol.asyncIterator]() {

                if (!opts.where) {
                    opts.where = x => undefined;
                }
                let ob = opts.orderBy;
                opts.orderBy = x => Sort.createUniqueSort(self.metadata, ob).Segments;
                let pageSize = iterateConfig.pageSize;


                let itemIndex = -1;
                let items: entityType[];

                let itStrategy: (() => Promise<IteratorResult<entityType>>);
                let nextPageFilter: EntityWhere<entityType> = x => undefined;;

                let j = 0;

                itStrategy = async () => {
                    if (opts.progress) {
                        opts.progress.progress(j++ / await this.count());
                    }
                    if (items === undefined || itemIndex == items.length) {
                        if (items && items.length < pageSize)
                            return { value: <entityType>undefined, done: true };
                        items = await cont.find({
                            where: [opts.where, nextPageFilter],
                            orderBy: opts.orderBy,
                            limit: pageSize,
                            load: opts.load
                        });
                        itemIndex = 0;
                        if (items.length == 0) {
                            return { value: <entityType>undefined, done: true };
                        } else {
                            nextPageFilter = self.createAfterFilter(opts.orderBy, items[items.length - 1]);
                        }

                    }
                    if (itemIndex < items.length)
                        return { value: items[itemIndex++], done: false };


                };
                return {
                    next: async () => {
                        let r = itStrategy();
                        return r;
                    }
                };
            }

        }
        return r;
    }


    getEntityRef(entity: entityType): EntityRef<entityType> {
        let x = entity[entityMember];
        if (!x) {
            x = new rowHelperImplementation(this._info, entity, this, this.edp, this.context, true);
            Object.defineProperty(entity, entityMember, {//I've used define property to hide this member from console.log
                get: () => x
            })

        }
        return x;
    }

    async delete(entity: entityType): Promise<void> {
        await this.getEntityRef(entity).delete();
    }
    async save(entity: entityType): Promise<entityType> {
        return await this.getEntityRef(entity).save();
    }
    async find(options?: FindOptions<entityType>): Promise<entityType[]> {
        let opt: EntityDataProviderFindOptions = {};
        if (!options)
            options = {};

        opt = {};
        if (!options.orderBy) {
            options.orderBy = this._info.entityInfo.defaultOrderBy;
        }
        opt.where = this.translateWhereToFilter(options.where);
        opt.orderBy = Sort.translateOrderByToSort(this.metadata, options.orderBy);

        opt.limit = options.limit;
        opt.page = options.page;

        let rawRows = await this.edp.find(opt);
        let loadFields: FieldMetadata[] = undefined;
        if (options.load)
            loadFields = options.load(this.metadata.fields);
        let result = await Promise.all(rawRows.map(async r =>
            await this.mapRawDataToResult(r, loadFields)
        ));
        return result;

    }

    private async mapRawDataToResult(r: any, loadFields: FieldMetadata[]) {
        if (!r)
            return undefined;
        let x = new this.entity(this.context);
        let helper = new rowHelperImplementation(this._info, x, this, this.edp, this.context, false);
        Object.defineProperty(x, entityMember, {//I've used define property to hide this member from console.log
            get: () => helper
        })
        await helper.loadDataFrom(r, loadFields);
        helper.saveOriginalData();

        return x;
    }

    async count(where?: EntityWhere<entityType>): Promise<number> {
        return this.edp.count(this.translateWhereToFilter(where));
    }
    private cache = new Map<string, cacheEntityInfo<entityType>>();
    findFirst(options?: EntityWhere<entityType> | FindFirstOptions<entityType>): Promise<entityType> {

        let opts: FindFirstOptions<entityType> = {};
        if (options) {
            if (typeof options === 'function')
                opts.where = <any>options;
            else
                opts = <any>options;
        }

        let r: Promise<entityType>;
        let cacheInfo: cacheEntityInfo<entityType>;
        if (opts.useCache || opts.useCache === undefined) {
            let f = Filter.packWhere(this.metadata, opts.where);
            let key = JSON.stringify(f);
            cacheInfo = this.cache.get(key);
            if (cacheInfo !== undefined) {
                if (cacheInfo.value && this.getEntityRef(cacheInfo.value).wasDeleted()) {
                    cacheInfo = undefined;
                    this.cache.delete(key);
                } else
                    return this.cache.get(key).promise;
            }
            else {
                cacheInfo = {
                    value: undefined,
                    promise: undefined
                };
                this.cache.set(key, cacheInfo);
            }
        }

        r = this.iterate(options).first().then(r => {
            if (!r && opts.createIfNotFound) {
                r = this.create();
                if (opts.where) {
                    __updateEntityBasedOnWhere(this.metadata, opts.where, r);
                }
            }
            return r;
        });
        if (cacheInfo) {
            cacheInfo.promise = r = r.then(r => {
                cacheInfo.value = r;
                return r;
            });

        }
        return r;
    }


    create(item?: Partial<entityType>): entityType {
        let r = new this.entity(this.context);
        let z = this.getEntityRef(r);
        if (item)
            Object.assign(r, item);

        return r;
    }
    async fromJson(json: any, newRow?: boolean): Promise<entityType> {
        let obj = {};
        for (const col of this.metadata.fields) {
            if (json[col.key] !== undefined) {
                obj[col.key] = col.valueConverter.fromJson(json[col.key]);
            }
        }
        if (newRow) {
            let r = this.create();
            let helper = this.getEntityRef(r) as rowHelperImplementation<entityType>;
            await helper.loadDataFrom(obj);
            return r;
        }
        else
            return this.mapRawDataToResult(obj, undefined);

    }
    findId(id: any, options?: FindFirstOptionsBase<entityType>): Promise<entityType> {
        if (typeof id !== "string" && typeof id !== "number")
            throw new Error("id can be either number or string, but got: " + typeof (id))
        return this.findFirst({
            ...options,
            where: x => this.metadata.idMetadata.getIdFilter(id),
        });
    }



    private translateWhereToFilter(where: EntityWhere<entityType>): Filter {
        if (this.metadata.options.fixedFilter)
            where = [where, this.metadata.options.fixedFilter];
        let filterFactories = Filter.createFilterFactories(this.metadata)
        let r = Filter.translateWhereToFilter(filterFactories, where);
        if (r && !this.dataProvider.supportsCustomFilter) {
            let f = r;
            r = new Filter(add => {
                f.__applyToConsumer(new customTranslator(add, custom => {
                    return this.metadata.options.customFilterTranslator.translateFilter(filterFactories, custom);
                }))
            });
        }
        return r;
    }

}
class customTranslator implements FilterConsumer {
    constructor(private orig: FilterConsumer, private translateCustom: (custom: any) => Filter) { }
    or(orElements: Filter[]) {
        this.orig.or(orElements.map(o => new Filter(add => o.__applyToConsumer(new customTranslator(add, this.translateCustom)))));
    }
    isEqualTo(col: FieldMetadata<any>, val: any): void {
        this.orig.isEqualTo(col, val);
    }
    isDifferentFrom(col: FieldMetadata<any>, val: any): void {
        this.orig.isDifferentFrom(col, val);
    }
    isNull(col: FieldMetadata<any>): void {
        this.orig.isNull(col);
    }
    isNotNull(col: FieldMetadata<any>): void {
        this.orig.isNotNull(col);
    }
    isGreaterOrEqualTo(col: FieldMetadata<any>, val: any): void {
        this.orig.isGreaterOrEqualTo(col, val);
    }
    isGreaterThan(col: FieldMetadata<any>, val: any): void {
        this.orig.isGreaterThan(col, val);
    }
    isLessOrEqualTo(col: FieldMetadata<any>, val: any): void {
        this.orig.isLessOrEqualTo(col, val);
    }
    isLessThan(col: FieldMetadata<any>, val: any): void {
        this.orig.isLessThan(col, val);
    }
    containsCaseInsensitive(col: FieldMetadata<any>, val: any): void {
        this.orig.containsCaseInsensitive(col, val);
    }
    startsWith(col: FieldMetadata<any>, val: any): void {
        this.orig.startsWith(col, val);
    }
    isIn(col: FieldMetadata<any>, val: any[]): void {
        this.orig.isIn(col, val);
    }
    custom(customItem: any): void {
        this.translateCustom(customItem)?.__applyToConsumer(this);
    }

}

export function __updateEntityBasedOnWhere<T>(entityDefs: EntityMetadata<T>, where: EntityWhere<T>, r: T) {
    let w = Filter.translateWhereToFilter(Filter.createFilterFactories(entityDefs), where);

    if (w) {
        w.__applyToConsumer({
            custom: () => { },
            containsCaseInsensitive: () => { },
            isDifferentFrom: () => { },
            isEqualTo: (col, val) => {
                r[col.key] = val;
            },
            isGreaterOrEqualTo: () => { },
            isGreaterThan: () => { },
            isIn: () => { },
            isLessOrEqualTo: () => { },
            isLessThan: () => { },
            isNotNull: () => { },
            isNull: () => { },
            startsWith: () => { },
            or: () => { }
        });
    }
}



export const entityInfo = Symbol("entityInfo");
const entityMember = Symbol("entityMember");
export function getEntitySettings<T>(entity: ClassType<T>, throwError = true) {
    if (entity === undefined)
        if (throwError) {
            throw new Error("Undefined is not an entity :)")
        }
        else return undefined;
    let info: EntityOptions = Reflect.getMetadata(entityInfo, entity);
    if (!info && throwError)
        throw new Error(entity.prototype.constructor.name + " is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?")

    return info;
}
export const columnsOfType = new Map<any, columnInfo[]>();
export function createOldEntity<T>(entity: ClassType<T>, context: Context) {
    let r: columnInfo[] = columnsOfType.get(entity);
    if (!r)
        columnsOfType.set(entity, r = []);

    let info = getEntitySettings(entity);


    let base = Object.getPrototypeOf(entity);
    while (base != null) {

        let baseCols = columnsOfType.get(base);
        if (baseCols) {
            r.unshift(...baseCols.filter(x => !r.find(y => y.key == x.key)));
        }
        base = Object.getPrototypeOf(base);
    }


    return new EntityFullInfo<T>(prepareColumnInfo(r), info, context);
}

abstract class rowHelperBase<T>
{
    error: string;
    constructor(protected columnsInfo: columnInfo[], protected instance: T, protected context: Context) {
        for (const col of columnsInfo) {
            let ei = getEntitySettings(col.settings.valueType, false);

            if (ei && context) {
                let lookup = new LookupColumn(context.for(col.settings.valueType) as RepositoryImplementation<T>, undefined);
                this.lookups.set(col.key, lookup);
                let val = instance[col.key];
                Object.defineProperty(instance, col.key, {
                    get: () =>
                        lookup.item,
                    set: (val) =>
                        lookup.set(val),
                    enumerable: true
                });
                instance[col.key] = val;
            }
        }
    }
    lookups = new Map<string, LookupColumn<any>>();
    async waitLoad() {
        await Promise.all([...this.lookups.values()].map(x => x.waitLoad()));
    }
    errors: { [key: string]: string };
    protected __assertValidity() {
        if (!this.hasErrors()) {
            let error: ErrorInfo = {
                modelState: Object.assign({}, this.errors),
                message: this.error
            }
            if (!error.message) {
                for (const col of this.columnsInfo) {
                    if (this.errors[col.key]) {
                        error.message = this.fields[col.key].metadata.caption + ": " + this.errors[col.key];
                        this.error = error.message;
                        break;
                    }
                }

            }
            throw error;


        }
    }
    abstract get fields(): Fields<T>;
    catchSaveErrors(err: any): any {
        let e = err;

        if (e instanceof Promise) {
            return e.then(x => this.catchSaveErrors(x));
        }
        if (e.error) {
            e = e.error;
        }

        if (e.message)
            this.error = e.message;
        else if (e.Message)
            this.error = e.Message;
        else this.error = e;
        let s = e.modelState;
        if (!s)
            s = e.ModelState;
        if (s) {
            this.errors = s;
        }
        throw err;

    }
    __clearErrors() {
        this.errors = undefined;
        this.error = undefined;
    }
    hasErrors(): boolean {
        return !!!this.error && this.errors == undefined;

    }
    protected copyDataToObject() {
        let d: any = {};
        for (const col of this.columnsInfo) {
            let lu = this.lookups.get(col.key);
            if (lu)
                d[col.key] = lu.id;
            else
                d[col.key] = this.instance[col.key];
        }
        return d;
    }
    originalValues: any = {};
    saveOriginalData() {
        this.originalValues = this.copyDataToObject();
    }
    async __validateEntity() {
        this.__clearErrors();

        await this.__performColumnAndEntityValidations();
        this.__assertValidity();
    }
    async __performColumnAndEntityValidations() {

    }
    toApiJson() {
        let result: any = {};
        for (const col of this.columnsInfo) {
            if (!this.context || col.settings.includeInApi === undefined || this.context.isAllowed(col.settings.includeInApi)) {
                let val;
                let lu = this.lookups.get(col.key);
                if (lu)
                    val = lu.id;
                else {
                    val = this.instance[col.key];
                    if (!this.context) {
                        if (val) {
                            let eo = getEntitySettings(val.constructor, false);
                            if (eo) {
                                val = getEntityRef(val).getId();
                            }
                        }
                    }
                }
                result[col.key] = col.settings.valueConverter.toJson(val);
            }
        }
        return result;
    }

    _updateEntityBasedOnApi(body: any) {
        for (const col of this.columnsInfo) {
            if (body[col.key] !== undefined)
                if (col.settings.includeInApi === undefined || this.context.isAllowed(col.settings.includeInApi)) {
                    if (!this.context || col.settings.allowApiUpdate === undefined || this.context.isAllowedForInstance(this.instance, col.settings.allowApiUpdate)) {
                        let lu = this.lookups.get(col.key);
                        if (lu)
                            lu.id = body[col.key];
                        else
                            this.instance[col.key] = col.settings.valueConverter.fromJson(body[col.key]);
                    }

                }
        }

    }
}
export class rowHelperImplementation<T> extends rowHelperBase<T> implements EntityRef<T> {



    constructor(private info: EntityFullInfo<T>, instance: T, public repository: RepositoryImplementation<T>, private edp: EntityDataProvider, context: Context, private _isNew: boolean) {
        super(info.columnsInfo, instance, context);
        this.metadata = info;
        if (_isNew) {
            for (const col of info.columnsInfo) {

                if (col.settings.defaultValue) {
                    if (typeof col.settings.defaultValue === "function") {
                        instance[col.key] = col.settings.defaultValue(instance, context);
                    }
                    else if (!instance[col.key])
                        instance[col.key] = col.settings.defaultValue;
                }

            }
        }
    }
    metadata: EntityMetadata<T>;
    getId() {
        if (this.info.idMetadata.field instanceof CompoundIdField)
            return this.info.idMetadata.field.getId(this.instance);
        else
            return this.instance[this.info.idMetadata.field.key];
    }


    private _wasDeleted = false;





    wasDeleted(): boolean {
        return this._wasDeleted;
    }

    undoChanges() {
        this.loadDataFrom(this.originalValues);
        this.__clearErrors();
    }
    async reload(): Promise<T> {
        await this.edp.find({ where: this.repository.metadata.idMetadata.getIdFilter(this.id) }).then(async newData => {
            await this.loadDataFrom(newData[0]);

        });
        return this.instance;
    }

    private _columns: Fields<T>;

    get fields(): Fields<T> {
        if (!this._columns) {
            let _items = [];
            let r = {
                find: (c: FieldMetadata<T> | string) => r[typeof c === "string" ? c : c.key],
                [Symbol.iterator]: () => _items[Symbol.iterator]()
            };
            for (const c of this.info.columnsInfo) {
                _items.push(r[c.key] = new FieldRefImplementation(c.settings, this.info.fields[c.key], this.instance, this, this));
            }

            this._columns = r as unknown as Fields<T>;
        }
        return this._columns;

    }

    async save(): Promise<T> {
        await this.__validateEntity();
        let doNotSave = false;
        if (this.info.entityInfo.saving) {
            await this.info.entityInfo.saving(this.instance, () => doNotSave = true);
        }

        this.__assertValidity();

        let d = this.copyDataToObject();
        if (this.info.idMetadata.field instanceof CompoundIdField)
            d.id = undefined;
        let updatedRow: any;
        try {
            if (this.isNew()) {
                updatedRow = await this.edp.insert(d);
            }
            else {
                if (doNotSave) {
                    updatedRow = (await this.edp.find({ where: this.repository.metadata.idMetadata.getIdFilter(this.id) }))[0];
                }
                else
                    updatedRow = await this.edp.update(this.id, d);
            }
            await this.loadDataFrom(updatedRow);
            if (this.info.entityInfo.saved)
                await this.info.entityInfo.saved(this.instance);

            this.saveOriginalData();
            this._isNew = false;
            return this.instance;
        }
        catch (err) {
            await this.catchSaveErrors(err);
        }

    }





    async delete() {
        this.__clearErrors();
        if (this.info.entityInfo.deleting)
            await this.info.entityInfo.deleting(this.instance);
        this.__assertValidity();

        try {
            await this.edp.delete(this.id);
            if (this.info.entityInfo.deleted)
                await this.info.entityInfo.deleted(this.instance);

            if (this.repository.listeners)
                for (const listener of this.repository.listeners.filter(x => x.deleted)) {
                    await listener.deleted(this.instance);
                }

            this._wasDeleted = true;
        } catch (err) {
            await this.catchSaveErrors(err);
        }
    }

    async loadDataFrom(data: any, loadItems?: FieldMetadata[]) {
        for (const col of this.info.fields) {
            let lu = this.lookups.get(col.key);
            if (lu) {
                lu.id = data[col.key];
                if (loadItems === undefined) {
                    if (!col.options.lazy)
                        await lu.waitLoad();
                }
                else {
                    if (loadItems.includes(col))
                        await lu.waitLoad();
                }
            }
            else
                this.instance[col.key] = data[col.key];

        }
        await this.calcServerExpression();
        if (this.repository.metadata.idMetadata.field instanceof CompoundIdField) {
            this.id = this.repository.metadata.idMetadata.field.getId(this.instance);
        } else
            this.id = data[this.repository.metadata.idMetadata.field.key];
    }
    private id;
    public getOriginalId() {
        return this.id;
    }

    private async calcServerExpression() {
        if (this.context.backend)
            for (const col of this.info.columnsInfo) {
                if (col.settings.serverExpression) {
                    this.instance[col.key] = await col.settings.serverExpression(this.instance);
                }
            }
    }

    isNew(): boolean {
        return this._isNew;
    }
    wasChanged(): boolean {
        for (const col of this.info.fields) {
            let val = this.instance[col.key];
            let lu = this.lookups.get(col.key);
            if (lu) {
                val = lu.id;
            }
            if (col.valueConverter.toJson(val) != col.valueConverter.toJson(this.originalValues[col.key]))
                return true;
        }
        return false;
    }

    async __performColumnAndEntityValidations() {
        for (const c of this.columnsInfo) {
            if (c.settings.validate) {
                let col = new FieldRefImplementation(c.settings, this.info.fields[c.key], this.instance, this, this);
                await col.__performValidation();
            }
        }

        if (this.info.entityInfo.validation)
            await this.info.entityInfo.validation(this.instance);
        if (this.repository.listeners)
            for (const listener of this.repository.listeners.filter(x => x.validating)) {
                await listener.validating(this.instance);
            }
    }
}
const controllerColumns = Symbol("controllerColumns");
function prepareColumnInfo(r: columnInfo[]): columnInfo[] {
    return r.map(x => ({
        key: x.key,
        type: x.type,
        settings: decorateColumnSettings(x.settings)
    }));
}

export function getFields<fieldsContainerType>(container: fieldsContainerType, context?: Context): Fields<fieldsContainerType> {
    return getControllerRef(container, context).fields;
}
export function getControllerRef<fieldsContainerType>(container: fieldsContainerType, context?: Context): controllerRefImpl<fieldsContainerType> {

    let result = container[controllerColumns] as controllerRefImpl<fieldsContainerType>;
    if (!result)
        result = container[entityMember];
    if (!result) {
        let columnSettings: columnInfo[] = columnsOfType.get(container.constructor);
        if (!columnSettings)
            columnsOfType.set(container.constructor, columnSettings = []);
        container[controllerColumns] = result = new controllerRefImpl(prepareColumnInfo(columnSettings), container, context);
    }
    return result;
}


export class controllerRefImpl<T = any> extends rowHelperBase<T>  {
    constructor(columnsInfo: columnInfo[], instance: any, context: Context) {
        super(columnsInfo, instance, context);


        let _items = [];
        let r = {
            find: (c: FieldMetadata<T> | string) => r[typeof c === "string" ? c : c.key],
            [Symbol.iterator]: () => _items[Symbol.iterator]()
        };

        for (const col of columnsInfo) {
            let settings = decorateColumnSettings(col.settings);
            _items.push(r[col.key] = new FieldRefImplementation<any, any>(settings, new columnDefsImpl(col, undefined, context), instance, undefined, this));
        }

        this.fields = r as unknown as Fields<T>;


    }
    async __performColumnAndEntityValidations() {
        for (const col of this.fields) {
            if (col instanceof FieldRefImplementation) {
                await col.__performValidation();
            }
        }
    }
    errors: { [key: string]: string; };
    originalValues: any;
    fields: Fields<T>;

}
export class FieldRefImplementation<entityType, valueType> implements FieldRef<entityType, valueType> {
    constructor(private settings: FieldOptions, public metadata: FieldMetadata, public container: any, private helper: EntityRef<entityType>, private rowBase: rowHelperBase<entityType>) {

    }
    isNull(): boolean {
        let lu = this.rowBase.lookups.get(this.metadata.key);
        if (lu) {
            return lu.id === undefined || lu.id === null;
        }
        return this.value === null;
    }
    async load(): Promise<valueType> {
        let lu = this.rowBase.lookups.get(this.metadata.key);
        if (lu) {
            if (this.wasChanged()) {
                await lu.waitLoadOf(this.rawOriginalValue());
            }
            return await lu.waitLoad();
        }
        return this.value;
    }
    target: ClassType<any> = this.settings.target;




    get error(): string {
        if (!this.rowBase.errors)
            return undefined;
        return this.rowBase.errors[this.metadata.key];
    }
    set error(error: string) {
        if (!this.rowBase.errors)
            this.rowBase.errors = {};
        this.rowBase.errors[this.metadata.key] = error;
    }
    get displayValue(): string {
        if (this.value != undefined) {
            if (this.settings.displayValue)
                return this.settings.displayValue(this.container, this.value);
            else if (this.metadata.valueConverter.displayValue)
                return this.metadata.valueConverter.displayValue(this.value);
            else
                return this.value.toString();
        }
        return "";
    };
    get value() { return this.container[this.metadata.key] };
    set value(value: any) { this.container[this.metadata.key] = value };
    get originalValue(): any {
        let lu = this.rowBase.lookups.get(this.metadata.key);
        if (lu)
            return lu.get(this.rawOriginalValue());
        return this.rowBase.originalValues[this.metadata.key];
    };
    private rawOriginalValue(): any {
        return this.rowBase.originalValues[this.metadata.key];
    }

    get inputValue(): string {
        let lu = this.rowBase.lookups.get(this.metadata.key);
        if (lu)
            return lu.id != undefined ? lu.id.toString() : null;
        return this.metadata.valueConverter.toInput(this.value, this.settings.inputType);
    }
    set inputValue(val: string) {
        let lu = this.rowBase.lookups.get(this.metadata.key);
        if (lu) {
            lu.setId(val);
        }
        else
            this.value = this.metadata.valueConverter.fromInput(val, this.settings.inputType);
    };
    wasChanged(): boolean {
        let val = this.value;
        let lu = this.rowBase.lookups.get(this.metadata.key);
        if (lu) {
            val = lu.id;
        }
        return this.metadata.valueConverter.toJson(this.rowBase.originalValues[this.metadata.key]) != this.metadata.valueConverter.toJson(val);
    }
    entityRef: EntityRef<any> = this.helper;


    async __performValidation() {
        let x = typeof (this.settings.validate);
        if (Array.isArray(this.settings.validate)) {
            for (const v of this.settings.validate) {
                await v(this.container, this);
            }
        } else if (typeof this.settings.validate === 'function')
            await this.settings.validate(this.container, this);
    }




}

export function getEntityRef<entityType>(entity: entityType, throwException = true): EntityRef<entityType> {
    let x = entity[entityMember];
    if (!x && throwException)
        throw new Error("item " + entity.constructor.name + " was not initialized using a context");
    return x;

}
export const CaptionTransformer = {
    transformCaption: (context: Context, key: string, caption: string) => caption
}
export function buildCaption(caption: string | ((context: Context) => string), key: string, context: Context): string {
    let result: string;
    if (typeof (caption) === "function") {
        if (context)
            result = caption(context);
    }
    else if (caption)
        result = caption;
    result = CaptionTransformer.transformCaption(context, key, result);
    if (result)
        return result;
    return makeTitle(key);
}

export class columnDefsImpl implements FieldMetadata {
    constructor(private colInfo: columnInfo, private entityDefs: EntityFullInfo<any>, private context: Context) {
        if (colInfo.settings.serverExpression)
            this.isServerExpression = true;
        if (typeof (this.colInfo.settings.allowApiUpdate) === "boolean")
            this.readonly = this.colInfo.settings.allowApiUpdate;
        if (!this.inputType)
            this.inputType = this.valueConverter.inputType;
        this.caption = buildCaption(colInfo.settings.caption, colInfo.key, context);




    }
    options: FieldOptions<any, any> = this.colInfo.settings;
    target: ClassType<any> = this.colInfo.settings.target;
    readonly: boolean;

    valueConverter = this.colInfo.settings.valueConverter;
    allowNull = !!this.colInfo.settings.allowNull;

    caption: string;
    get dbName() {
        let result;
        if (this.colInfo.settings.sqlExpression) {
            if (typeof this.colInfo.settings.sqlExpression === "function") {
                result = this.colInfo.settings.sqlExpression(this.entityDefs, this.context);
            } else
                result = this.colInfo.settings.sqlExpression;
        }
        if (result)
            return result;
        return this.colInfo.settings.dbName;

    }
    inputType = this.colInfo.settings.inputType;
    key = this.colInfo.settings.key;
    get dbReadOnly() {
        return this.colInfo.settings.dbReadOnly || this.dbName != this.colInfo.settings.dbName
    };
    isServerExpression: boolean;
    valueType = this.colInfo.settings.valueType;
}
class EntityFullInfo<T> implements EntityMetadata<T> {

    options = this.entityInfo;

    constructor(public columnsInfo: columnInfo[], public entityInfo: EntityOptions, private context: Context) {


        let _items = [];
        let r = {
            find: (c: FieldMetadata<any> | string) => r[typeof c === "string" ? c : c.key],
            [Symbol.iterator]: () => _items[Symbol.iterator](),

        };

        for (const x of columnsInfo) {
            _items.push(r[x.key] = new columnDefsImpl(x, this, context));
        }

        this.fields = r as unknown as FieldsMetadata<T>;

        this.dbAutoIncrementId = entityInfo.dbAutoIncrementId;
        this.key = entityInfo.key;
        this.caption = buildCaption(entityInfo.caption, entityInfo.key, context);
        if (typeof entityInfo.dbName === "string")
            this.dbName = entityInfo.dbName;
        else if (typeof entityInfo.dbName === "function")
            this.dbName = entityInfo.dbName(this.fields, context);
        if (entityInfo.id) {
            this.idMetadata.field = entityInfo.id(this.fields)
        } else {
            if (this.fields["id"])
                this.idMetadata.field = this.fields["id"];
            else
                this.idMetadata.field = [...this.fields][0];
        }
    }
    idMetadata: IdMetadata<T> = {
        field: undefined,
        createIdInFilter: (items: T[]): Filter => {
            if (items.length > 0)
                return new OrFilter(...items.map(x => this.idMetadata.getIdFilter(getEntityRef(x).getId())));


        },
        isIdField: (col: FieldMetadata<any>): boolean => {
            return col.key == this.idMetadata.field.key;
        },
        getIdFilter: (id: any): Filter => {
            if (this.idMetadata.field instanceof CompoundIdField)
                return this.idMetadata.field.isEqualTo(id);
            else
                return new Filter(x => x.isEqualTo(this.idMetadata.field, id));
        }
    };


    dbAutoIncrementId: boolean;




    fields: FieldsMetadata<T>;


    key: string;
    dbName: string;
    caption: string;


}




export function FieldType<valueType = any>(settings?: FieldOptions<any, valueType>) {
    return target => {
        if (!settings) {
            settings = {};
        }
        if (!settings.valueType)
            settings.valueType = target;
        Reflect.defineMetadata(storableMember, settings, target);
        return target;
    }

}
export function DateOnlyField<entityType = any>(settings?: FieldOptions<entityType, Date>) {
    return Field({
        valueConverter: DateOnlyValueConverter
        , ...settings
    })
}
export function IntegerField<entityType = any>(settings?: FieldOptions<entityType, Number>) {
    return Field({
        valueType: Number,
        valueConverter: IntegerValueConverter
        , ...settings
    })
}
export function ValueListFieldType<entityType = any, valueType extends ValueListItem = any>(type: ClassType<valueType>, settings?: FieldOptions<entityType, valueType>) {
    return FieldType<valueType>({
        valueConverter: new ValueListValueConverter(type),
        displayValue: (item, val) => val.caption
        , ...settings
    })
}

export function Field<entityType = any, valueType = any>(settings?: FieldOptions<entityType, valueType>) {
    if (!settings) {
        settings = {};
    }


    return (target, key, c?) => {
        if (!settings.key) {
            settings.key = key;
        }

        if (!settings.dbName)
            settings.dbName = settings.key;

        let names: columnInfo[] = columnsOfType.get(target.constructor);
        if (!names) {
            names = [];
            columnsOfType.set(target.constructor, names)
        }

        let type = settings.valueType;
        if (!type) {
            type = Reflect.getMetadata("design:type", target, key);
            settings.valueType = type;
        }
        if (!settings.target)
            settings.target = target;

        let set = names.find(x => x.key == key);
        if (!set)
            names.push({
                key,
                settings,
                type
            });
        else {
            Object.assign(set.settings, settings);
        }

    }



}
const storableMember = Symbol("storableMember");
export function decorateColumnSettings<valueType>(settings: FieldOptions<any, valueType>) {

    if (settings.valueType) {
        let settingsOnTypeLevel = Reflect.getMetadata(storableMember, settings.valueType);
        if (settingsOnTypeLevel) {
            settings = {
                ...settingsOnTypeLevel,
                ...settings
            }
        }
    }

    if (settings.valueType == String) {
        let x = settings as unknown as FieldOptions<any, String>;
        if (!settings.valueConverter)
            x.valueConverter = {
                toJson: x => x,
                fromJson: x => x
            };
    }

    if (settings.valueType == Number) {
        let x = settings as unknown as FieldOptions<any, Number>;
        if (!settings.valueConverter)
            x.valueConverter = NumberValueConverter;
    }
    if (settings.valueType == Date) {
        let x = settings as unknown as FieldOptions<any, Date>;
        if (!settings.valueConverter) {
            x.valueConverter = DateValueConverter;
        }
    }

    if (settings.valueType == Boolean) {
        let x = settings as unknown as FieldOptions<any, Boolean>;
        if (!x.valueConverter)
            x.valueConverter = BoolValueConverter;
    }
    if (!settings.valueConverter) {
        let ei = getEntitySettings(settings.valueType, false);
        if (ei) {
            settings.valueConverter = {
                toDb: x => x,
                fromDb: x => x
            };
        }
        else
            settings.valueConverter = DefaultValueConverter;
    }
    if (!settings.valueConverter.toJson) {
        settings.valueConverter.toJson = x => x;
    }
    if (!settings.valueConverter.fromJson) {
        settings.valueConverter.fromJson = x => x;
    }
    if (!settings.valueConverter.toDb) {
        settings.valueConverter.toDb = x => settings.valueConverter.toJson(x);
    }
    if (!settings.valueConverter.fromDb) {
        settings.valueConverter.fromDb = x => settings.valueConverter.fromJson(x);
    }
    if (!settings.valueConverter.toInput) {
        settings.valueConverter.toInput = x => settings.valueConverter.toJson(x);
    }
    if (!settings.valueConverter.fromInput) {
        settings.valueConverter.fromInput = x => settings.valueConverter.fromJson(x);
    }





    return settings;
}

interface columnInfo {
    key: string;
    settings: FieldOptions,
    type: any
}
export function Entity<entityType>(options: EntityOptions<entityType>) {
    return target => {
        if (!options.key || options.key == '')
            options.key = target.name;
        let base = Object.getPrototypeOf(target);
        if (base) {
            let opt = Reflect.getMetadata(entityInfo, target);
            if (opt) {
                options = {
                    ...opt,
                    ...options
                }
            }
        }
        if (!options.dbName)
            options.dbName = options.key;
        allEntities.push(target);
        setControllerSettings(target, { key: undefined })
        Reflect.defineMetadata(entityInfo, options, target);
        return target;
    }
}






export class EntityBase {
    get _(): EntityRef<this> { return getEntityRef(this) }
    save() { return this._.save(); }
    delete() { return this._.delete(); }
    isNew() { return this._.isNew(); }
    wasChanged() { return this._.wasChanged(); }
    get $() { return this._.fields }
}

class cacheEntityInfo<entityType> {
    value: entityType = {} as entityType;
    promise: Promise<entityType>
}