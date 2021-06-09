import { ServerContext } from '../context';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Field, Entity, EntityBase, rowHelperImplementation, EntityWhere } from '../remult3';
import { async, waitForAsync } from '@angular/core/testing';
import { Filter } from '../filter/filter-interfaces';




@Entity({ key: 'categories' })
class Categories extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
}

@Entity({ key: 'products' })
class Products extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field()
    category: Categories;
}


describe("many to one relation", () => {

    it("what", async(async () => {
        let mem = new InMemoryDataProvider();
        let context = new ServerContext(mem);
        let cat = context.for(Categories).create();
        cat.id = 1;
        cat.name = "cat 1";
        await cat.save();
        let p = context.for(Products).create();
        p.id = 10;
        p.name = "prod 10";
        p.category = cat;
        expect(p.category.id).toBe(1, "right after set");
        //    expect(p.category.name).toBe("cat 1", "right after set");
        await p.$.category.load();
        expect(p.category.name).toBe("cat 1", "after set and wait load");
        await p.save();
        expect(p.category.name).toBe("cat 1", "after save");
        expect(mem.rows[context.for(Products).defs.key][0].category).toBe(1);
        expect(p._.toApiJson().category).toBe(1, "to api pojo");
        p = await context.for(Products).findFirst();
        expect(p.id).toBe(10);
        expect(p.category.id).toBe(1);
        await p.$.category.load();
        expect(p.category.name).toBe("cat 1");
        expect((await p.$.name.load())).toBe("prod 10");
        expect(await context.for(Products).count(x => x.category.isEqualTo(cat))).toBe(1);

        let c2 = context.for(Categories).create();
        c2.id = 2;
        c2.name = "cat 2";
        await c2.save();
        expect(p.wasChanged()).toBe(false, "x");
        expect(p.$.category.wasChanged()).toBe(false, "y");
        p.category = c2;
        expect(p.wasChanged()).toBe(true);
        expect(p.$.category.wasChanged()).toBe(true);
        expect(p.$.category.value.id).toBe(2);
        expect(p.$.category.originalValue.id).toBe(1);
        await p.save();
        expect(p.wasChanged()).toBe(false, "a");
        expect(p.$.category.wasChanged()).toBe(false);
        expect(p.$.category.value.id).toBe(2);
        expect(p.$.category.originalValue.id).toBe(2);
        p.category = null;
        await p.save();
        expect(p.$.category.inputValue).toBeNull(null);
        p.category = cat;
        expect(p.$.category.inputValue).toBe("1");
        p.$.category.inputValue = "2";
        expect(p.category).toBe(c2);
    }));

    it("test wait load", async(async () => {
        let mem = new InMemoryDataProvider();
        let context = new ServerContext(mem);
        let cat = context.for(Categories).create();
        cat.id = 1;
        cat.name = "cat 1";
        await cat.save();
        let c2 = context.for(Categories).create();
        c2.id = 2;
        c2.name = "cat 2";
        await c2.save();
        let p = context.for(Products).create();
        p.id = 10;
        p.name = "prod 10";
        p.category = cat;
        await p.save();
        context = new ServerContext(mem);
        p = await context.for(Products).findFirst();
        p.category = c2;
        await p.$.category.load();
        expect(p.category.name).toBe("cat 2");
        expect(p.$.category.value.name).toBe("cat 2");
        expect(p.$.category.originalValue.name).toBe("cat 1");



    }));
    it("test null", waitForAsync(async () => {
        let mem = new InMemoryDataProvider();
        let context = new ServerContext(mem);

        let p = context.for(Products).create();
        p.id = 10;
        p.name = "prod 10";
        expect(p.category).toBe(null);
        expect(p.category === undefined).toBe(false);
        expect(p.category === null).toBe(true);
        expect(null == undefined).toBe(true);
        //expect(p.category==undefined).toBe(false);
        expect(p.category == null).toBe(true);
        await p.save();

        p = await context.for(Products).findFirst();
        expect(p.category).toBe(null);

        expect(await context.for(Products).count(x => x.category.isEqualTo(null))).toBe(1);
    }));
    it("test stages", async(async () => {
        let mem = new InMemoryDataProvider();
        let context = new ServerContext(mem);

        let p = context.for(Products).create();
        p.id = 10;
        p.name = "prod 10";

        let c = context.for(Categories).create();
        c.id = 1;
        c.name = "cat 1";
        await c.save();
        p.category = c;
        await p.save();
        context = new ServerContext(mem);
        p = await context.for(Products).findFirst();
        expect(p.category).toBeUndefined();
        expect(p.category === undefined).toBe(true);
        expect(p.category === null).toBe(false);
        await p.$.category.load();
        expect(p.category.name).toBe("cat 1");

    }));
    it("test update from api", async(async () => {
        let mem = new InMemoryDataProvider();
        let context = new ServerContext(mem);

        let p = context.for(Products).create();
        p.id = 10;
        p.name = "prod 10";

        let c = context.for(Categories).create();
        c.id = 1;
        c.name = "cat 1";
        await c.save();
        await p.save();
        expect(p.category).toBeNull();
        (p._ as rowHelperImplementation<Products>)._updateEntityBasedOnApi({ category: 1 });
        expect(p.$.category.inputValue).toBe('1');
        await p.$.category.load();
        expect(p.category.id).toBe(c.id);
    }));
    it("test easy create", async(async () => {
        let mem = new InMemoryDataProvider();
        let context = new ServerContext(mem);

        let c = await context.for(Categories).create({
            id: 1,
            name: 'cat 1'
        }).save();
        expect(c.id).toBe(1);
        expect(c.name).toBe('cat 1');

        let p = context.for(Products).create({
            id: 10,
            name: "prod 10",
            category: c
        });
        expect(p.category.id).toBe(1);
        await p.save();
        expect(p.category.id).toBe(1);
    }));
    fit("test filter create", waitForAsync(async () => {
        let mem = new InMemoryDataProvider();
        let context = new ServerContext(mem);
        let c = await context.for(Categories).create({
            id: 1,
            name: 'cat 1'
        }).save();
        let c2 = await context.for(Categories).create({
            id: 2,
            name: 'cat 2'
        }).save();
        let repo = context.for(Products);
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
        async function test(where: EntityWhere<Products>, expected: number) {
            expect(await repo.count(where)).toBe(expected);
            expect(await repo.count(p => Filter.unpackWhere(repo.defs, Filter.packWhere(repo.defs,
                where)))).toBe(expected, "packed where");
        }

        test(p => p.category.isEqualTo(null), 3);
        test(p => p.category.isEqualTo(c), 2);
        test(p => p.category.isEqualTo(c2), 1);

    }));


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
