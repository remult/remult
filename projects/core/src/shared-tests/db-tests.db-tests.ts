
import { DataApi } from "../data-api";
import { DateOnlyField, Entity, EntityBase, Field } from "../remult3";
import { Done } from "../tests/Done";
import { Categories as newCategories } from "../tests/remult-3-entities";
import { tasks } from "../tests/tasks";
import { TestDataApiResponse } from "../tests/TestDataApiResponse";
import { testAll } from "./db-tests-setup";
import { entityWithValidations } from "./entityWithValidations";


testAll("what", async ({ remult }) => {
    await remult.repo(stam).create({ id: 1, title: 'noam' }).save();
    expect(await remult.repo(stam).count()).toBe(1);
}, false);
testAll("filter works on all db",
    async ({ remult }) => {
        let s = await entityWithValidations.create4RowsInDp(remult);
        expect((await s.find({ where: { myId: [1, 3] } })).length).toBe(2);
    });
testAll("filter works on all db or",
    async ({ remult }) => {

        let s = await entityWithValidations.create4RowsInDp(remult);
        expect((await s.find({ where: { $or: [{ myId: 1 }, { myId: 3 }] } })).length).toBe(2);

    });
testAll("entity with different id column still works well", async ({ remult }) => {
    let s = remult.repo(entityWithValidations);
    let c = s.create();
    c.myId = 1; c.name = 'noam';
    await c._.save();
    c.name = 'yael';
    await c._.save();
    expect(c.name).toBe('yael');
    expect((await s.find()).length).toBe(1);
});

testAll("empty find works", async ({ remult }) => {
    let c = remult.repo(newCategories).create();
    c.id = 5;
    c.categoryName = 'test';
    await c._.save();
    let l = await remult.repo(newCategories).find();
    expect(l.length).toBe(1);
    expect(l[0].categoryName).toBe('test');


});
testAll("partial updates", async ({ remult }) => {

    let c = remult.repo(newCategories).create({
        id: 5, categoryName: 'test', description: 'desc'
    });
    await c._.save();
    let l = await remult.repo(newCategories).findId(5);
    c.categoryName = 'newname';
    l.description = 'new desc';
    await c.save();
    await l.save();
    expect(l.categoryName).toBe('newname');
    expect(l.description).toBe('new desc');


});
testAll("put with validations on entity fails",
    async ({ remult }) => {
        let s = remult.repo(entityWithValidations);
        let c = s.create();
        c.myId = 1;
        c.name = 'noam';
        await c._.save();
        let api = new DataApi(s, remult);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.error = async (data: any) => {
            expect(data.modelState.name).toBe('invalid');
            d.ok();
        };
        await api.put(t, 1, {
            name: '1'
        });
        d.test();
        var x = await s.find({ where: { myId: 1 } });
        expect(x[0].name).toBe('noam');
        x = await s.find({ where: { myId: 1 } });
        expect(x[0].name).toBe('noam');

    });
testAll("test date with null works", async ({ remult }) => {

    let repo = remult.repo(testDateWithNull);
    let r = repo.create({ id: 0 });
    await r.save();
    r = await repo.findFirst();
    expect(r.d).toBeNull();
    expect(await repo.count({ d: null })).toBe(1);
});
testAll("test original value of date", async ({ remult }) => {
    let r = await remult.repo(testDateWithNull).create({ id: 1, d: new Date(1976, 6, 16) }).save();

    expect(r.$.d.originalValue.getFullYear()).toBe(1976);

});

@Entity('testDateWithNull', { allowApiCrud: true })
class testDateWithNull extends EntityBase {
    @Field()
    id: number = 0;
    @DateOnlyField({ allowNull: true })
    d: Date;
}

testAll("test string with null works", async ({ remult }) => {

    let repo = remult.repo(testStringWithNull);
    let r = repo.create({ id: 0 });
    await r.save();
    r = await repo.findFirst();
    expect(r.d).toBeNull();
});

testAll("test tasks", async ({ remult }) => {

    let c = remult.repo(tasks);
    let t = c.create();
    t.id = 1;
    await t._.save();
    t = c.create();
    t.id = 2;
    t.completed = true;
    await t._.save();
    t = c.create();
    t.id = 3;
    t.completed = true;
    await t._.save();
    await c.create({ id: 4, completed: false }).save();

    expect(await c.count({ completed: false })).toBe(2);
    expect(await c.count({ completed: { $ne: true } })).toBe(2);
    expect(await c.count({ completed: true })).toBe(2);
});

@Entity('teststringWithNull', { allowApiCrud: true })
class testStringWithNull extends EntityBase {
    @Field()
    id: number = 0;
    @Field({ allowNull: true })
    d: string;
}



@Entity("a", { allowApiCrud: true })
export class stam extends EntityBase {
    @Field()
    id: number = 0;
    @Field()
    title: string = '';
}


