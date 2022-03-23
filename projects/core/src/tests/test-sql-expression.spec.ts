import { Remult } from '../context';

import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { SqlDatabase } from '../data-providers/sql-database';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Field, Entity, EntityBase, IntegerField, DateOnlyField, ValueListFieldType, NumberField, StringField } from '../remult3';

import { IdEntity } from '../id-entity';
import { postgresColumnSyntax } from '../../postgres/postgresColumnSyntax';

import { SqlCommand, SqlResult } from '../sql-command';
import { FilterConsumerBridgeToSqlRequest, getDbNameProvider } from '../filter/filter-consumer-bridge-to-sql-request';

describe("test sql database expressions", () => {
    let web = new WebSqlDataProvider("test");
    let db = new SqlDatabase(web);
    let remult = new Remult();
    remult.setDataProvider(db);
    async function deleteAll() {
        await web.dropTable(remult.repo(testSqlExpression).metadata);
        await web.dropTable(remult.repo(expressionEntity).metadata);

    }
    it("test basics", async () => {
        await deleteAll();
        let x = remult.repo(testSqlExpression).create();
        x.code = 3;
        await x._.save();
        expect(x.code).toBe(3);
        expect(x.testExpression).toBe(15, "after save");
        expect(x._.fields.testExpression.originalValue).toBe(15, "after save");
        x = await remult.repo(testSqlExpression).findFirst();

        expect(x.testExpression).toBe(15);
    });
    it("test undefined behaves as a column", async () => {
        await deleteAll();
        let x = remult.repo(expressionEntity);
        let n = await getDbNameProvider(x.metadata);
        expect((n.nameOf(x.metadata.fields.col))).toBe('col');
        expect((await x.create({ col: 'abc', id: 1 }).save()).col).toBe('abc');
        expect(n.isDbReadonly(x.metadata.fields.col)).toBe(false);
        let c = new Remult();
        c.setDataProvider(db);
        expressionEntity.yes = true;
        x = c.repo(expressionEntity);
        n = await getDbNameProvider(x.metadata);
        expect(n.nameOf(x.metadata.fields.col)).toBe("'1+1'");
        expect((await x.create({ col: 'abc', id: 2 }).save()).col).toBe('1+1');
        expect(n.isDbReadonly(x.metadata.fields.col)).toBe(true);
    });
    it("test asyync dbname", async () => {
        let z = await remult.repo(testServerExpression1).metadata.getDbName();
        expect(z).toBe('testServerExpression1');
    });

});
@Entity('expressionEntity')
class expressionEntity extends EntityBase {
    @IntegerField()
    id: number;
    static yes: boolean;
    @StringField({
        sqlExpression: async () => expressionEntity.yes ? "'1+1'" : undefined
    })
    col: string;
}




@Entity('testSqlExpression')
class testSqlExpression extends EntityBase {
    @NumberField()
    code: number;
    @NumberField<testSqlExpression>(
        {
            sqlExpression: async (x) => {
                return await x.fields.code.getDbName() + ' * 5';
            }
        }
    )
    testExpression: number;

}

@Entity('testServerExpression1', {
    sqlExpression: async () => new Promise(res => setTimeout(() => {
        res('testServerExpression1');
    }, 30))
})
class testServerExpression1 extends EntityBase {

    @NumberField()
    code: number;

}
export class myDummySQLCommand implements SqlCommand {

    execute(sql: string): Promise<SqlResult> {
        throw new Error("Method not implemented.");
    }
    addParameterAndReturnSqlToken(val: any): string {
        if (val === null)
            return "null";
        if (val instanceof Date)
            val = val.toISOString();
        if (typeof (val) == "string") {
            return '\'' + val.replace(/'/g, '\'\'') + '\'';
        }
        return val.toString();
    }


}
describe("test filter for date", () => {
    it("filter", async () => {
        let c = new Remult()
        let e = c.repo(testCreate);
        var d = new myDummySQLCommand();
        var db = await getDbNameProvider(e.metadata);
        let f = new FilterConsumerBridgeToSqlRequest(d, db);
        f.isGreaterOrEqualTo(e.metadata.fields.theDate, new Date("2021-08-06T05:05:25.440Z"));
        expect(await f.resolveWhere()).toBe(" where theDate >= '2021-08-05T21:00:00.000Z'");
    });
});

describe("Postgres create db", () => {

    let c = new Remult()
    it("what", () => {
        let e = c.repo(testCreate);
        expect(postgresColumnSyntax(e.metadata.fields.theDate, "x")).toBe("x date");
        expect(postgresColumnSyntax(e.metadata.fields.i, "x")).toBe("x integer default 0 not null");
        expect(postgresColumnSyntax(e.metadata.fields.s, "x")).toBe("x varchar default '' not null", "s");
        expect(postgresColumnSyntax(e.metadata.fields.s2, "x")).toBe("x varchar default '' not null", "s2");
    });


});

@ValueListFieldType()
class intId {
    static z = new intId(0, '');
    constructor(public id: number, public caption: string) {

    }
}
@ValueListFieldType()
class stringId {
    static z = new stringId('0', '');
    constructor(public id: string, public caption: string) {

    }
}
@ValueListFieldType()
class stringId2 {
    static z = new stringId2();
    constructor(public id?: string, public caption?: string) {

    }
}
@Entity('testCreate')
class testCreate extends IdEntity {

    @DateOnlyField()
    theDate: Date;
    @Field(() => intId)
    i: intId;
    @Field(() => stringId)
    s: stringId;
    @Field(() => stringId2)
    s2: stringId2;
}