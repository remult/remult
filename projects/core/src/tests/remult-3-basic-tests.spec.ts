import { ServerContext } from "../..";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { fitAsync, itAsync } from "./testHelper.spec";
import { Products } from './remult-3-entities';
import { createOldEntity } from "../remult3";


describe("remult-3-basics", () => {
    itAsync("test the very basics", async () => {
        let mem = new InMemoryDataProvider();
        let c = new ServerContext(mem);
        console.log(123);
        expect (await c.for(Products).count()).toBe(0);
        let p = c.for(Products).create();
        p.name = "noam";
        p.price=5;
        p.archived = false;
        await c.for(Products).save(p);
        expect (await c.for(Products).count()).toBe(1);
        
    });
});

//