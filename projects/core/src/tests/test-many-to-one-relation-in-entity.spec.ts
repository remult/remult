import { Remult } from '../context';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Field, Entity, EntityBase, rowHelperImplementation, EntityFilter, FieldType } from '../remult3';

import { entityFilterToJson, Filter } from '../filter/filter-interfaces';
import { Language } from './RowProvider.spec';
import { ValueListValueConverter } from '../../valueConverters';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { SqlDatabase } from '../data-providers/sql-database';
import { Done, TestDataApiResponse } from './testHelper.spec';
import { DataApi } from '../data-api';

import { actionInfo } from '../server-action';





@Entity('categories')
class Categories extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field({ valueConverter: new ValueListValueConverter(Language) })
    language: Language
    @Field()
    archive: boolean = false;
}
@Entity('suppliers')
class Suppliers extends EntityBase {
    @Field()
    supplierId: string;
    @Field()
    name: string;
}
@Entity('products')
class Products extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field({
        lazy: true
    })
    category: Categories;
    @Field()
    supplier: Suppliers;

}
@Entity('products')
class ProductsEager extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field()
    category: Categories;

}
@Entity('profile')
class profile extends EntityBase {
    @Field()
    id: string;
    async rel() {
        return this.remult.repo(following).findFirst({
            where: f => f.id.isEqualTo('1').and(f.profile.isEqualTo(this)),
            createIfNotFound: true
        })


    }
    @Field<profile>({
        serverExpression: async self => {
            await self.rel();
            return false;
        }
    })
    following: boolean;
    constructor(private remult: Remult) {
        super();
    }
}
@Entity('following')
class following extends EntityBase {
    @Field()
    id: string;
    @Field()
    profile: profile;

}


describe("many to one relation", () => {
    beforeEach(() => actionInfo.runningOnServer = true);
    afterEach(() => actionInfo.runningOnServer = false);
    it("xx", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        await remult.repo(profile).create({ id: '1' }).save();
        let p = await remult.repo(profile).findId('1');
        expect(p.following).toBe(false);
    });
    it("test that it is loaded to begin with", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let category = await remult.repo(Categories).create({ id: 1, name: 'cat 1' }).save();
        await remult.repo(Products).create({ id: 1, name: 'p1', category }).save();
        remult.clearAllCache();
        let p = await remult.repo(ProductsEager).findId(1);
        expect(p.category.id).toBe(1);

    });
    it("test that it is loaded onDemand", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let category = await remult.repo(Categories).create({ id: 1, name: 'cat 1' }).save();
        await remult.repo(Products).create({ id: 1, name: 'p1', category }).save();
        remult.clearAllCache();
        let p = await remult.repo(ProductsEager).findId(1, { load: () => [] });
        expect(p.category).toBe(undefined);
        await p.$.category.load();
        expect(p.category.id).toBe(1);
    });
    it("test that it is loaded onDemand", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let category = await remult.repo(Categories).create({ id: 1, name: 'cat 1' }).save();
        await remult.repo(Products).create({ id: 1, name: 'p1', category }).save();
        remult.clearAllCache();
        let p = await remult.repo(ProductsEager).findFirst({
            where: p => p.id.isEqualTo(1),
            load: () => []
        });
        expect(p.category).toBe(undefined);
        await p.$.category.load();
        expect(p.category.id).toBe(1);
    });

    it("what", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = remult.repo(Categories).create();
        cat.id = 1;
        cat.name = "cat 1";
        await cat.save();
        let p = remult.repo(Products).create();
        p.id = 10;
        p.name = "prod 10";
        p.category = cat;
        expect(p.category.id).toBe(1, "right after set");
        //    expect(p.category.name).toBe("cat 1", "right after set");
        await p.$.category.load();
        expect(p.category.name).toBe("cat 1", "after set and wait load");
        await p.save();
        expect(p.category.name).toBe("cat 1", "after save");
        expect(mem.rows[remult.repo(Products).metadata.key][0].category).toBe(1);
        expect(p._.toApiJson().category).toBe(1, "to api pojo");
        p = await remult.repo(Products).findFirst();
        expect(p.id).toBe(10);
        expect(p.category.id).toBe(1);
        await p.$.category.load();
        expect(p.category.name).toBe("cat 1");
        expect((await p.$.name.load())).toBe("prod 10");
        expect(await remult.repo(Products).count(x => x.category.isEqualTo(cat))).toBe(1);

        let c2 = remult.repo(Categories).create();
        c2.id = 2;
        c2.name = "cat 2";
        await c2.save();
        expect(p.wasChanged()).toBe(false, "x");
        expect(p.$.category.valueChanged()).toBe(false, "y");
        p.category = c2;
        expect(p.wasChanged()).toBe(true);
        expect(p.$.category.valueChanged()).toBe(true);
        expect(p.$.category.value.id).toBe(2);
        expect(p.$.category.originalValue.id).toBe(1);
        await p.save();
        expect(p.wasChanged()).toBe(false, "a");
        expect(p.$.category.valueChanged()).toBe(false);
        expect(p.$.category.value.id).toBe(2);
        expect(p.$.category.originalValue.id).toBe(2);
        p.category = null;
        await p.save();
        expect(p.$.category.inputValue).toBeNull();
        p.category = cat;
        expect(p.$.category.inputValue).toBe("1");
        p.$.category.inputValue = "2";
        expect(p.category).toBe(c2);
    });

    it("test wait load", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = remult.repo(Categories).create();
        cat.id = 1;
        cat.name = "cat 1";
        await cat.save();
        let c2 = remult.repo(Categories).create();
        c2.id = 2;
        c2.name = "cat 2";
        await c2.save();
        let p = remult.repo(Products).create();
        p.id = 10;
        p.name = "prod 10";
        p.category = cat;
        await p.save();
        remult = new Remult();
        remult.setDataProvider(mem);
        p = await remult.repo(Products).findFirst();
        p.category = c2;
        await p.$.category.load();
        expect(p.category.name).toBe("cat 2");
        expect(p.$.category.value.name).toBe("cat 2");
        expect(p.$.category.originalValue.name).toBe("cat 1");



    });
    it("test null", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);

        let p = remult.repo(Products).create();
        p.id = 10;
        p.name = "prod 10";
        expect(p.category).toBe(null);
        expect(p.category === undefined).toBe(false);
        expect(p.category === null).toBe(true);
        expect(null == undefined).toBe(true);
        //expect(p.category==undefined).toBe(false);
        expect(p.category == null).toBe(true);
        await p.save();

        p = await remult.repo(Products).findFirst();
        expect(p.category).toBe(null);

        expect(await remult.repo(Products).count(x => x.category.isEqualTo(null))).toBe(1);
    });
    it("test stages", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);

        let p = remult.repo(Products).create();
        p.id = 10;
        p.name = "prod 10";

        let c = remult.repo(Categories).create();
        c.id = 1;
        c.name = "cat 1";
        await c.save();
        p.category = c;
        await p.save();
        remult = new Remult();
        remult.setDataProvider(mem);
        p = await remult.repo(Products).findFirst();
        expect(p.category).toBeUndefined();
        expect(p.category === undefined).toBe(true);
        expect(p.category === null).toBe(false);
        await p.$.category.load();
        expect(p.category.name).toBe("cat 1");

    });
    it("test update from api", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);

        let p = remult.repo(Products).create();
        p.id = 10;
        p.name = "prod 10";

        let c = remult.repo(Categories).create();
        c.id = 1;
        c.name = "cat 1";
        await c.save();
        await p.save();
        expect(p.category).toBeNull();
        (p._ as rowHelperImplementation<Products>)._updateEntityBasedOnApi({ category: 1 });
        expect(p.$.category.inputValue).toBe('1');
        await p.$.category.load();
        expect(p.category.id).toBe(c.id);
    });
    it("test easy create", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);

        let c = await remult.repo(Categories).create({
            id: 1,
            name: 'cat 1'
        }).save();
        expect(c.id).toBe(1);
        expect(c.name).toBe('cat 1');

        let p = remult.repo(Products).create({
            id: 10,
            name: "prod 10",
            category: c
        });
        expect(p.category.id).toBe(1);
        await p.save();
        expect(p.category.id).toBe(1);
    });
    it("test filter create", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let c = await remult.repo(Categories).create({
            id: 1,
            name: 'cat 1'
        }).save();
        let c2 = await remult.repo(Categories).create({
            id: 2,
            name: 'cat 2'
        }).save();
        let repo = remult.repo(Products);
        await repo.create({
            id: 10,
            name: "prod 10",
            category: c
        }).save();
        await repo.create({
            id: 11,
            name: "prod 1",
            category: c
        }).save();
        await repo.create({
            id: 12,
            name: "prod 12",
            category: c2
        }).save();
        await repo.create({
            id: 13,
            name: "prod 13",
        }).save();
        await repo.create({
            id: 14,
            name: "prod 14",
        }).save();
        await repo.create({
            id: 15,
            name: "prod 15",
        }).save();
        async function test(where: EntityFilter<Products>, expected: number) {
            expect(await repo.count(where)).toBe(expected);
            expect(await repo.count(async p => Filter.fromJson(repo.metadata, await entityFilterToJson(repo.metadata,
                where)))).toBe(expected, "packed where");
        }

        await test(p => p.category.isEqualTo(c), 2);
        await test(p => p.category.isEqualTo(null), 3);
        await test(p => p.category.isEqualTo(c2), 1);

    });
    it("test that not too many reads are made", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2'
        }).save();
        let p = await remult.repo(Products).create({
            id: 10,
            name: "prod 10",
            category: cat
        }).save();
        let fetches = 0;
        remult = new Remult();
        remult.setDataProvider({
            transaction: undefined,
            getEntityDataProvider: e => {
                let r = mem.getEntityDataProvider(e);
                return {
                    find: x => {
                        fetches++;
                        return r.find(x);
                    }, count: r.count, delete: r.delete, insert: r.insert, update: r.update
                }

            }
        });
        p = await remult.repo(Products).findFirst();
        expect(fetches).toBe(1);
        p._.toApiJson();
        expect(fetches).toBe(1);
    });
    it("test update only updates what's needed", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2'
        }).save();
        let p = await remult.repo(Products).create({
            id: 10,
            name: "prod 10",
            category: cat
        }).save();

        remult = new Remult();
        let d = new Done();
        remult.setDataProvider({
            transaction: undefined,
            getEntityDataProvider: e => {
                let r = mem.getEntityDataProvider(e);
                return {
                    find: x => r.find(x), count: r.count, delete: r.delete, insert: r.insert, update: (id, data) => {
                        d.ok();
                        expect(data).toEqual({ name: "prod 11" });
                        return r.update(id, data)
                    }
                }

            }
        });
        p = await remult.repo(Products).findFirst();
        p.name = "prod 11";
        await p.save();
        d.test();
    });
    it("test is null doesn't invoke read", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2'
        }).save();
        let p = await remult.repo(Products).create({
            id: 10,
            name: "prod 10",
            category: cat
        }).save();
        let fetches = 0;
        remult = new Remult();
        remult.setDataProvider({
            transaction: undefined,
            getEntityDataProvider: e => {
                let r = mem.getEntityDataProvider(e);
                return {
                    find: x => {
                        fetches++;
                        return r.find(x);
                    }, count: r.count, delete: r.delete, insert: r.insert, update: r.update
                }

            }
        });

        p = await remult.repo(Products).findFirst();
        expect(fetches).toBe(1);
        expect(p.$.category.valueIsNull()).toBe(false);
        expect(fetches).toBe(1);
    });
    it("test to and from json ", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2', language: Language.Russian
        }).save();
        let json = cat._.toApiJson();
        let x = await remult.repo(Categories).fromJson(json);
        expect(x.isNew()).toBe(false);
        expect(x.language).toBe(Language.Russian);
        expect(x.archive).toBe(false);
        x.name = 'cat 3';
        await x.save();
        let rows = await remult.repo(Categories).find();
        expect(rows.length).toBe(1);
        expect(rows[0].name).toBe('cat 3');

    });
    it("test to and from json 2", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2'
        }).save();
        let p = await remult.repo(Products).create({ id: 10, name: 'p1' }).save();
        let json = p._.toApiJson();
        let x = await remult.repo(Products).fromJson(json);
        expect(x.isNew()).toBe(false);
        await p.$.category.load();
        expect(p.category).toBe(null);
        p.category = cat;
        await p.save();

        json = p._.toApiJson();
        x = await remult.repo(Products).fromJson(json);
        expect(x.isNew()).toBe(false);
        await p.$.category.load();
        expect(p.category.id).toBe(cat.id);
    });
    it("test to and from json 2", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await (await remult.repo(Categories).fromJson({
            id: 1, name: 'cat 2'
        }, true)).save();
        expect(await remult.repo(Categories).count()).toBe(1);

    });
    it("test lookup with create", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2'
        }).save();
        let p = await remult.repo(Products).findFirst({ createIfNotFound: true, where: p => p.id.isEqualTo(10).and(p.category.isEqualTo(cat)) });
        expect(p.isNew()).toBe(true);
        expect(p.id).toBe(10);
        expect((await p.$.category.load()).id).toBe(cat.id);
    });
    it("test set with id", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2'
        }).save();

        let p = remult.repo(Products).create({
            id: 10,
            category: 1 as any
        });
        expect(p.id).toBe(10);
        expect((await p.$.category.load()).id).toBe(cat.id);
    });
    it("test set with json object", async () => {
        let mem = new InMemoryDataProvider();
        let remult = new Remult();
        remult.setDataProvider(mem);
        let cat = await remult.repo(Categories).create({
            id: 1, name: 'cat 2'
        }).save();

        let p = remult.repo(Products).create({
            id: 10,
            category: cat._.toApiJson()
        });
        expect(p.id).toBe(10);
        expect((await p.$.category.load()).id).toBe(cat.id);
        expect((await p.$.category.load()).isNew()).toBe(false);
    });
    it("test relation in sql", async () => {
        var wsql = new WebSqlDataProvider("test2");
        let db = new SqlDatabase(wsql);
        let remult = new Remult();
        remult.setDataProvider(db);
        for (const x of [Categories, Products, Suppliers] as any[]) {
            let e = remult.repo(x).metadata;
            await wsql.dropTable(e);
            await wsql.createTable(e);
        }
        let cat = await remult.repo(Categories).create({ id: 1, name: 'cat' }).save();
        let sup = await remult.repo(Suppliers).create({ supplierId: 'sup1', name: 'sup1name' }).save();
        let p = await remult.repo(Products).create({
            id: 10,
            name: 'prod',
            category: cat,
            supplier: sup
        }).save();
        await p.$.category.load();
        expect(p.category.id).toBe(cat.id);
        let sqlr = (await db.execute("select category,supplier from products")).rows[0];
        expect(sqlr.category).toEqual('1.0');
        expect(sqlr.supplier).toBe('sup1');
        expect(await remult.repo(Products).count(p => p.supplier.isEqualTo(sup))).toBe(1);
        expect(await remult.repo(Products).count(p => p.supplier.isIn([sup]))).toBe(1);


    });


});


export type test<Type> = {
    [Properties in keyof Type]: Type[Properties];
}
export type test2<Type> = Partial<test<Type>>;
let z: test2<Categories>;
z = {
    id: 3,
    name: 'noam'
}


@FieldType<h>({
    valueConverter: {
        toJson: x => x != undefined ? x : '',
        fromJson: x => x ? x : null
    },
})
@Entity<h>('h', {
    saving: self => {
        if (self.refH)
            self.refHId = self.refH.id;
        else
            self.refHId = '';
    },
    allowApiCrud: true

})
class h extends EntityBase {
    @Field()
    id: string;
    @Field()
    refH: h;
    @Field()
    refHId: string;
}

describe("Test entity relation and count finds", () => {
    it("test it", async () => {
        let mem = new InMemoryDataProvider();
        let c = new Remult();
        c.setDataProvider(mem);
        await c.repo(h).create({ id: '1' }).save();
        expect(mem.rows['h'][0]).toEqual({ id: '1', refH: '', refHId: '' });
        let countFind = 0;
        c = new Remult();
        c.setDataProvider({
            transaction: mem.transaction,
            getEntityDataProvider: x => {
                let r = mem.getEntityDataProvider(x);
                return {
                    count: r.count,
                    delete: r.delete,
                    insert: r.insert,
                    update: r.update,
                    find: (o) => {
                        countFind++;
                        return r.find(o)
                    }
                }
            }
        });
        let h1 = await c.repo(h).findId('1');
        await h1.$.refH.load();
        expect(countFind).toBe(1);
    });
    it("test api", async () => {
        let mem = new InMemoryDataProvider();
        let c = new Remult();
        c.setDataProvider(mem);
        let a = await c.repo(h).create({ id: 'a' }).save();
        let b = await c.repo(h).create({ id: 'b' }).save();
        await c.repo(h).create({ id: 'd', refH: a }).save();
        c = new Remult()//clear the cache;
        c.setDataProvider(mem);
        let api = new DataApi(c.repo(h), c);
        let t = new TestDataApiResponse();
        let done = new Done();
        t.success = d => {
            expect(d.id).toBe('d');
            expect(d.refH).toBe('b');
            expect(d.refHId).toBe('b');
            done.ok();
        }
        await api.put(t, 'd', { refH: 'b' });
        done.test();
    });

    it("test api get array doesn't load", async () => {
        let mem = new InMemoryDataProvider();
        let c = new Remult();
        c.setDataProvider(mem);
        let a = await c.repo(h).create({ id: 'a' }).save();
        let b = await c.repo(h).create({ id: 'b' }).save();
        await c.repo(h).create({ id: 'd', refH: a }).save();
        c = new Remult()//clear the cache;
        let fetches = 0;
        c.setDataProvider({
            transaction: undefined,
            getEntityDataProvider: e => {
                let r = mem.getEntityDataProvider(e);
                return {
                    find: x => {
                        fetches++;
                        return r.find(x);
                    }, count: r.count, delete: r.delete, insert: r.insert, update: r.update
                }

            }
        });
        let api = new DataApi(c.repo(h), c);
        let t = new TestDataApiResponse();
        let done = new Done();
        t.success = d => {

            done.ok();
        }
        await api.getArray(t, {
            get: (key) => {
                if (key == 'id')
                    return 'd';
            }
        });
        done.test();
        expect(fetches).toBe(1);
    });

});