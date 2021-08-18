
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Context } from '../context';
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
    @Field((o, c) => o.caption = "456")
    c: string;

}

describe("test decorator precedence", () => {



    it("test basics", async () => {
        let c = new Context();
        let r = c.repo(myEntity);
        expect([...r.metadata.fields].length).toBe(3);
        expect(r.metadata.fields.a.caption).toBe('123');
        expect(r.metadata.fields.b.caption).toBe('123');
        expect(r.metadata.fields.c.caption).toBe('456');
    });
    it("testit", () => {
        let c = new Context();
        let r = c.repo(user).create();
        expect(r.$.username.metadata.caption).toBe("Username");
    })


});

@Entity({ key: 'profile' })
class profile extends EntityBase {
    @Field()
    username: string;
}
@Entity({ key: 'user' })
class user extends profile {
    @Field()
    email: string;
}