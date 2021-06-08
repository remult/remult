import { itAsync, Done, fitAsync } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Context, ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories, CategoriesForTesting } from './remult-3-entities';
import { createData, insertFourRows, testAllDbs } from './RowProvider.spec';
import { Field, Entity, EntityBase, EntityWhere, FindOptions, Repository } from '../remult3';

@Entity({ key: 'my entity' })
class myEntity extends EntityBase {

    @Field()
    @Field({ caption: '123' })
    a: string;

    @Field({ caption: '123' })
    @Field()
    b: string;
    @Field({ caption: context => "456" })
    c: string;

}

describe("test decorator precedence", () => {



    itAsync("test basics", async () => {
        let c = new Context();
        let r = c.for(myEntity);
        expect([...r.defs.fields].length).toBe(3);
        expect(r.defs.fields.a.caption).toBe('123');
        expect(r.defs.fields.b.caption).toBe('123');
        expect(r.defs.fields.c.caption).toBe('456');
    });


});