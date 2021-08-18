
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { Products } from './remult-3-entities';
import { createOldEntity, getEntityRef } from "../remult3";
import { Remult } from "../context";


describe("remult-3-basics", () => {
    it("test the very basics", async () => {
        let mem = new InMemoryDataProvider();
        let c = new Remult();
        c.setDataProvider(mem);
        expect(await c.repo(Products).count()).toBe(0);
        let p = c.repo(Products).create();
        p.id = 1;
        p.name = "noam";
        p.price = 5;
        p.archived = false;
        await c.repo(Products).save(p);
        expect(await c.repo(Products).count()).toBe(1);
        expect(await c.repo(Products).count(p => p.id.isEqualTo(1))).toBe(1);
        expect(await c.repo(Products).count(p => p.id.isEqualTo(2))).toBe(0);
        p = c.repo(Products).create();
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
        await c.repo(Products).save(p);
        expect(await c.repo(Products).count()).toBe(3);
        let products = await c.repo(Products).find({
            where: x => x.id.isEqualTo(2)
        });
        expect(products[0].name).toBe("yael");
        p = await c.repo(Products).findFirst(p => p.id.isEqualTo(3));
        expect(p.name).toBe("yoni");
    });
});

