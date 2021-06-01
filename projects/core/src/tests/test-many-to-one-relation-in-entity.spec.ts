import { itAsync, Done, fitAsync } from './testHelper.spec';
import { Context, ServerContext } from '../context';

import { JsonDataProvider } from '../data-providers/json-data-provider';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { IdEntity } from '../id-entity';

import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';
import { Categories as newCategories } from './remult-3-entities';
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

    fit("what", async(async () => {
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
        await p.save();
        
        expect (mem.rows[context.for(Products).defs.key][0].category).toBe(1);
        p = await context.for(Products).findFirst();
        expect(p.id).toBe(10);
        expect(p.category.id).toBe(1);
        expect(p.category.name).toBe("cat 1");
        
    }));
});