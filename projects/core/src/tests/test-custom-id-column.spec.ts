

import { createData } from './RowProvider.spec';
import { fitAsync, itAsync } from './testHelper.spec';

import { Categories } from './testModel/models';

import { iterateConfig, ServerContext } from '../context';
import { Column, Context, createAfterFilter, createAUniqueSort, Entity } from '../..';
import { TestBed } from '@angular/core/testing';
import { EntityOrderBy, EntityWhere, extractSort } from '../data-interfaces';
import { StringColumn } from '../columns/string-column';
import { CompoundIdColumn } from '../columns/compound-id-column';
import { packWhere } from '../filter/filter-consumer-bridge-to-url-builder';
import { fitWithDataProvider, itWithDataProvider } from './basicRowFunctionality.spec';
import { NumberColumn } from '../columns/number-column';


describe("custom id column", () => {
    itWithDataProvider("basic test", async (dpf) => {
        let context = new ServerContext(dpf);
        let c = context.for(class extends Entity<number>{
            a = new NumberColumn();
            b = new NumberColumn();
            constructor() {
                super({
                    name: 'custom'

                });
            }
        });
        let r = c.create();
        r.a.value = 1;
        r.b.value = 1;
        await r.save();
        r = c.create();
        r.a.value = 2;
        r.b.value = 2;
        await r.save();
        expect(r.columns.idColumn).toBe(r.a);


    });
    itWithDataProvider("basic test id column not first column", async (dpf) => {
        let context = new ServerContext(dpf);
        let c = context.for(class extends Entity<number>{
            a = new NumberColumn();
            id = new NumberColumn();
            constructor() {
                super({
                    name: 'custom2'

                });
            }
        });
        let r = c.create();
        r.a.value = 1;
        r.id.value = 5;
        await r.save();
        r = c.create();
        r.a.value = 2;
        r.id.value = 6;
        await r.save();
        expect(r.columns.idColumn).toBe(r.id);
        expect((await c.findId(6)).a.value).toBe(2);


    });
  
});