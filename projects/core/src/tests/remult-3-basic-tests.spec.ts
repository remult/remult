
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { fitAsync, itAsync } from "./testHelper.spec";
import { Products } from './remult-3-entities';
import { createOldEntity, getEntityRef } from "../remult3";
import { Context } from "../context";


describe("remult-3-basics", () => {
    itAsync("test the very basics", async () => {
        let mem = new InMemoryDataProvider();
        let c = new Context();
        c.setDataProvider(mem);
        expect(await c.for(Products).count()).toBe(0);
        let p = c.for(Products).create();
        p.id = 1;
        p.name = "noam";
        p.price = 5;
        p.archived = false;
        await c.for(Products).save(p);
        expect(await c.for(Products).count()).toBe(1);
        expect(await c.for(Products).count(p => p.id.isEqualTo(1))).toBe(1);
        expect(await c.for(Products).count(p => p.id.isEqualTo(2))).toBe(0);
        p = c.for(Products).create();
        p.id = 2;
        p.name = "yael";
        p.price = 10;
        p.archived = true;
        await getEntityRef(p).save();
        p = new Products();
        p.id = 3;
        p.name = "yoni";
        p.price = 7;
        p.archived = false;
        await c.for(Products).save(p);
        expect(await c.for(Products).count()).toBe(3);
        let products = await c.for(Products).find({
            where: x => x.id.isEqualTo(2)
        });
        expect(products[0].name).toBe("yael");
        p = await c.for(Products).findFirst(p => p.id.isEqualTo(3));
        expect(p.name).toBe("yoni");
    });
});

