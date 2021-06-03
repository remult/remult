import {  ServerContext } from '../context';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Column, Entity, EntityBase } from '../remult3';
import { async } from '@angular/core/testing';




@Entity({ key: 'categories' })
class Categories extends EntityBase {
    @Column()
    id: number;
    @Column()
    name: string;
}

@Entity({ key: 'products' })
class Products extends EntityBase {
    @Column()
    id: number;
    @Column()
    name: string;
    @Column()
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
        expect(p._.toApiPojo().category).toBe(1, "to api pojo");
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

    /*
[V] where category =
[V] was changed
[V] wait load - what to do with it.
[V] set (so it'll be in the cache immediately)
[V] redescribe the get experience (null, loading, found)
[V] null
[V] original value?


*/
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
    it("test null", async(async () => {
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
        p._._updateEntityBasedOnApi({ category: 1 });
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
