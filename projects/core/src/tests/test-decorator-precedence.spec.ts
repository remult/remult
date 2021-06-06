import { itAsync, Done, fitAsync } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Context, ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories, CategoriesForTesting } from './remult-3-entities';
import { createData, insertFourRows, testAllDbs } from './RowProvider.spec';
import { Column, Entity, EntityBase, EntityWhere, FindOptions, Repository } from '../remult3';

@Entity({ key: 'my entity' })
class myEntity extends EntityBase {

    @Column()
    @Column({ caption: '123' })
    a: string;

    @Column({ caption: '123' })
    @Column()
    b: string;
    @Column({ caption: context => "456" })
    c: string;

}

describe("test where stuff", () => {



    itAsync("test basics", async () => {
        let c = new Context();
        let r = c.for(myEntity);
        expect([...r.defs.columns].length).toBe(3);
        expect(r.defs.columns.a.caption).toBe('123');
        expect(r.defs.columns.b.caption).toBe('123');
        expect(r.defs.columns.c.caption).toBe('456');
    });


});