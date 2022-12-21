import { DataApi } from "../data-api";
import { Fields, Entity, EntityBase, EntityFilter, Field } from "../remult3";
import { c } from "../tests/c";

import { Done } from "../tests/Done";
import { h } from "../tests/h";
import { Categories as newCategories } from "../tests/remult-3-entities";
import { tasks } from "../tests/tasks";
import { TestDataApiResponse } from "../tests/TestDataApiResponse";
import { testAll, testAllDbs } from "./db-tests-setup";
import { entityWithValidations, testConfiguration } from "./entityWithValidations";
import { Remult } from "../context";
import { dWithPrefilter } from "../tests/dWithPrefilter";
import { entityFilterToJson, Filter } from "../filter/filter-interfaces";
import { d } from "../tests/d";
import { entityForCustomFilter1 } from "../tests/entityForCustomFilter";
import { entityWithValidationsOnColumn } from "../tests/entityWithValidationsOnColumn";
import { Validators } from "../validators";
import { Status } from "../tests/testModel/models";
import { IdEntity } from "../id-entity";



testAll("what", async ({ remult, createEntity }) => {
    await (await createEntity(stam)).create({ id: 1, title: 'noam' }).save();
    expect(await remult.repo(stam).count()).toBe(1);
}, false);
testAll("filter works on all db",
    async ({ createEntity }) => {
        let s = await entityWithValidations.create4RowsInDp(createEntity);
        expect((await s.find({ where: { myId: [1, 3] } })).length).toBe(2);
    }, false);
testAll("test in statement and ", async ({ createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    expect(await repo.count({ myId: [1, 3], $and: [{ myId: [3] }] })).toBe(1);
}, false);
testAll("filter with and",
    async ({ createEntity }) => {
        let s = await entityWithValidations.create4RowsInDp(createEntity);
        expect((await s.find({ where: { $and: [{ myId: 1 }, { myId: 3 }] } })).length).toBe(0);
    }, false);
testAll("test empty in",
    async ({ createEntity }) => {
        let s = await entityWithValidations.create4RowsInDp(createEntity);
        expect((await s.find({ where: { myId: [] } })).length).toBe(0);
    }, false);
testAll("filter works on all db or",
    async ({ createEntity }) => {

        let s = await entityWithValidations.create4RowsInDp(createEntity);
        expect((await s.find({ where: { $or: [{ myId: 1 }, { myId: 3 }] } })).length).toBe(2);

    }, false);
testAll("filter works on all db or_1",
    async ({ createEntity }) => {

        let s = await entityWithValidations.create4RowsInDp(createEntity);
        expect((await s.find({ where: { $or: [{}, {}] } })).length).toBe(4);

    }, false);
testAll("filter works on all db or_2",
    async ({ createEntity }) => {

        let s = await entityWithValidations.create4RowsInDp(createEntity);
        expect((await s.find({ where: { $or: [{}, { myId: 3 }] } })).length).toBe(4);

    }, false);
testAll("entity with different id column still works well", async ({ createEntity }) => {
    let s = await createEntity(entityWithValidations);
    let c = s.create();
    c.myId = 1; c.name = 'noam';
    await c._.save();
    c.name = 'yael';
    await c._.save();
    expect(c.name).toBe('yael');
    expect((await s.find()).length).toBe(1);
}, false);

testAll("empty find works", async ({ remult, createEntity }) => {
    let c = (await createEntity(newCategories)).create();
    c.id = 5;
    c.categoryName = 'test';
    await c._.save();
    let l = await remult.repo(newCategories).find();
    expect(l.length).toBe(1);
    expect(l[0].categoryName).toBe('test');


}, false);
testAll("test descending", async ({ createEntity }) => {
    const repo = await createEntity(newCategories);
    await repo.create({ id: 1, categoryName: 'a' }).save();
    await repo.create({ id: 2, categoryName: 'b' }).save();

    const rows = await repo.find({
        orderBy: { categoryName: 'desc' },
        page: -1
    })
    expect(rows[0].id).toBe(2);
}, false);
testAll("test descending 2", async ({ createEntity }) => {
    const repo = await createEntity(newCategories);
    await repo.insert([{ id: 1, categoryName: 'a' }, { id: 2, categoryName: 'b' }]);

    const rows = await repo.find({
        orderBy: { categoryName: 'desc' },
        page: -1
    })
    expect(rows[0].id).toBe(2);
}, false);
testAll("partial updates", async ({ remult, createEntity }) => {

    let c = (await createEntity(newCategories)).create({
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


}, false);
testAll("put with validations on entity fails",
    async ({ remult, createEntity }) => {
        let s = await createEntity(entityWithValidations);
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
testAll("test date with null works", async ({ createEntity }) => {

    let repo = await createEntity(testDateWithNull);
    let r = repo.create({ id: 0 });
    await r.save();
    r = await repo.findFirst();
    expect(r.d).toBeNull();
    expect(await repo.count({ d: null })).toBe(1);
}, false);
testAll("test original value of date", async ({ createEntity }) => {
    let r = await (await createEntity(testDateWithNull)).create({ id: 1, d: new Date(1976, 6, 16) }).save();

    expect(r.$.d.originalValue.getFullYear()).toBe(1976);

});

@Entity('testDateWithNull', { allowApiCrud: true })
class testDateWithNull extends EntityBase {
    @Fields.integer()
    id: number = 0;
    @Fields.dateOnly({ allowNull: true })
    d: Date;
}

testAll("test string with null works", async ({ createEntity }) => {

    let repo = await createEntity(testStringWithNull);
    let r = repo.create({ id: 0 });
    await r.save();
    r = await repo.findFirst();
    expect(r.d).toBeNull();
});

testAll("test tasks", async ({ createEntity }) => {

    let c = await createEntity(tasks);
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
}, false);
testAll("test filtering of null/''", async ({ createEntity }) => {
    let repo = await createEntity(h);
    let a = await repo.create({ id: 'a' }).save();
    let b = await repo.create({ id: 'b' }).save();
    let c = await repo.create({ id: 'c', refH: b }).save();
    expect(await repo.count({ refH: null })).toBe(2);
    expect(await repo.count({ refH: { "!=": null } })).toBe(1);
}, false)
    ;

testAll("test paging with complex object", async ({ remult, createEntity }) => {
    await createEntity(c);
    await createEntity(p);

    let c1 = await remult.repo(c).create({ id: 1, name: 'c1' }).save();
    let c2 = await remult.repo(c).create({ id: 2, name: 'c2' }).save();
    let c3 = await remult.repo(c).create({ id: 3, name: 'c3' }).save();

    await remult.repo(p).create({ id: 1, name: 'p1', c: c1 }).save();
    await remult.repo(p).create({ id: 2, name: 'p2', c: c2 }).save();
    await remult.repo(p).create({ id: 3, name: 'p3', c: c3 }).save();
    await remult.repo(p).create({ id: 4, name: 'p4', c: c3 }).save();
    await remult.repo(p).create({ id: 5, name: 'p5', c: c3 }).save();
    let i = 0;
    for await (const x of remult.repo(p).query({
        orderBy: { c: "asc", id: "asc" }
    })) {
        i++;
    }
    expect(i).toBe(5);
},false)
testAll("test paging with complex object_2", async ({ remult, createEntity }) => {

    let c1 = await (await createEntity(c)).create({ id: 1, name: 'c1' }).save();

    await (await createEntity(p)).create({ id: 1, name: 'p1', c: c1 }).save();
    expect((await remult.repo(p).findFirst({ c: c1 })).id).toBe(1);
});




testAll("test filter doesn't collapse", async ({ createEntity }) => {
    let repo = await createEntity(dWithPrefilter);
    let d1 = await repo.create({ id: 1, b: 1 }).save();
    await repo.create({ id: 2, b: 2 }).save();
    let d4 = await repo.create({ id: 4, b: 2 }).save();

    let f: EntityFilter<dWithPrefilter> = { id: 1, $and: [{ id: 2 }] };
    expect(await repo.count(f)).toBe(0);
    expect((await repo.find({ where: f })).length).toBe(0);
    let json = Filter.entityFilterToJson(repo.metadata, f);
    f = Filter.entityFilterFromJson(repo.metadata, json);
    expect(await repo.count(f)).toBe(0);
    expect((await repo.find({ where: f })).length).toBe(0);
});



testAll("test filter doesn't collapse", async ({ createEntity }) => {
    let repo = await createEntity(d);
    let d1 = await repo.create({ id: 1, b: 1 }).save();
    await repo.create({ id: 2, b: 2 }).save();
    let d4 = await repo.create({ id: 4, b: 2 }).save();

    let f: EntityFilter<d> = { id: [1, 2] };
    expect(await repo.count(f)).toBe(2);
    expect((await repo.find({ where: f })).length).toBe(2);
    let json = Filter.entityFilterToJson(repo.metadata, f);

    f = Filter.entityFilterFromJson(repo.metadata, json);
    expect(await repo.count(f)).toBe(2);
    expect((await repo.find({ where: f })).length).toBe(2);
});
testAll("test that it works with inheritance", async ({ createEntity }) => {

    let c = await createEntity(entityForCustomFilter1);
    for (let id = 0; id < 5; id++) {
        await c.create({ id }).save();
    }
    expect(await (c.count(entityForCustomFilter1.oneAndThree()))).toBe(2);
    expect((await (c.findFirst(entityForCustomFilter1.testNumericValue(2)))).id).toBe(2);
    expect((await (c.findFirst(entityForCustomFilter1.testObjectValue({ val: 2 })))).id).toBe(2);
})
testAll("put with validations on column fails", async ({ remult, createEntity }) => {

    var s = await createEntity(entityWithValidationsOnColumn);
    let c = s.create();

    c.myId = 1;
    c.name = 'noam';
    await c._.save();
    let api = new DataApi(s, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
        expect(data.modelState.name).toBe('invalid on column');
        d.ok();
    };
    await api.put(t, 1, {
        name: '1'
    });
    d.test();
    var x = await s.find({ where: { myId: 1 } });
    expect(x[0].name).toBe('noam');

});
testAllDbs("Insert", async ({ createData }) => {
    let forCat = await createData(async x => { });
    let rows = await forCat.find();
    expect(rows.length).toBe(0);
    let c = forCat.create();
    c.id = 1;
    c.categoryName = 'noam';
    await c._.save();
    rows = await forCat.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(1);
    expect(rows[0].categoryName).toBe('noam');
}, false);

testAllDbs("test delete", async ({ createData }) => {
    let c = await createData(async insert => await insert(5, 'noam'));

    let rows = await c.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(5);
    await rows[0]._.delete();
    rows = await c.find();
    expect(rows.length).toBe(0);
}, false);
testAllDbs("test filter packer", async ({ insertFourRows }) => {
    let r = await insertFourRows();
    let rows = await r.find();
    expect(rows.length).toBe(4);

    rows = await r.find({
        where: Filter.entityFilterFromJson(r.metadata, entityFilterToJson(r.metadata, { description: 'x' }))

    });
    expect(rows.length).toBe(2);
    rows = await r.find({ where: Filter.entityFilterFromJson(r.metadata, entityFilterToJson(r.metadata, { id: 4 })) });
    expect(rows.length).toBe(1);
    expect(rows[0].categoryName).toBe('yael');
    rows = await r.find({ where: Filter.entityFilterFromJson(r.metadata, entityFilterToJson(r.metadata, { description: 'y', categoryName: 'yoni' })) });
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(2);
    rows = await r.find({ where: Filter.entityFilterFromJson(r.metadata, entityFilterToJson(r.metadata, { id: { $ne: [2, 4] } })) });
    expect(rows.length).toBe(2);
}, false);
testAll("Test unique Validation,", async ({ createEntity }) => {
    let type = class extends newCategories {
        a: string
    };
    Entity('categories')(type);
    Fields.string<typeof type.prototype>({
        validate: async (en, col) => {
            if (en._.isNew() || en.a != en._.fields.a.originalValue) {
                if (await c.count({ a: en.a }))
                    en._.fields.a.error = 'already exists';
            }
        }
    })(type.prototype, "a");
    var c = await createEntity(type);

    var cat = c.create();
    cat.a = '12';
    cat.id = 1;
    await cat._.save();
    cat = c.create();
    cat.a = '12';

    var saved = false;
    try {
        await cat._.save();
        saved = true;
    }
    catch (err) {
        expect(cat._.fields.a.error).toEqual("already exists");
    }
    expect(saved).toBe(false);
});


testAll("Test unique Validation 2", async ({ createEntity }) => {
    let type = class extends newCategories {
        a: string
    };
    Entity('sdfgds')(type);
    Fields.string<typeof type.prototype>({
        validate: Validators.unique
    })(type.prototype, "a");
    var c = await createEntity(type);
    var cat = c.create();
    cat.a = '12';

    await cat._.save();
    cat = c.create();
    cat.a = '12';

    var saved = false;
    try {
        await cat._.save();
        saved = true;
    }
    catch (err) {
        expect(cat._.fields.a.error).toEqual("already exists");
    }
    expect(saved).toBe(false);
});

@Entity('testNumbers', { allowApiCrud: true })
class testNumbers extends EntityBase {
    @Fields.integer()
    id: number;
    @Fields.number()
    a: number;
}

testAll("test that integer and int work", async ({ createEntity }) => {
    let e = await (await createEntity(testNumbers)).create({
        id: 1.5,
        a: 1.5
    }).save();
    expect(e.id).toBe(2);
    expect(e.a).toBe(1.5);

});

testAll("post with logic works and max in entity", async ({ remult, createEntity }) => {
    let c = await createEntity(entityWithValidations);

    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.created = async (data: any) => {
        expect(data.name).toBe('noam honig');
        expect(data.myId).toBe(1);
        d.ok();
    };
    entityWithValidations.savingRowCount = 0;
    await api.post(t, { name: 'noam honig', myId: 1 });
    expect(entityWithValidations.savingRowCount).toBe(1);
    d.test();
})
testAllDbs("get array works with filter in body", async ({ createData, remult }) => {
    let c = await createData(async (i) => {
        await i(1, 'noam', undefined, Status.open);
        await i(2, 'yael', undefined, Status.closed);
        await i(3, 'yoni', undefined, Status.hold);
    });
    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
        expect(data.length).toBe(2);
        expect(data[0].id).toBe(2);
        expect(data[1].id).toBe(3);
        d.ok();
    };
    await api.getArray(t, {
        get: x => {
            return undefined;
        }
    }, {
        status_in: '[1, 2]'
    });
    d.test();
}, false);
testAllDbs("entity order by works", async ({ createData }) => {

    let type = class extends newCategories { };
    Entity<typeof type.prototype>('', {
        defaultOrderBy: { categoryName: "asc" },

    })(type);

    let c = await createData(async insert => {
        await insert(1, 'noam');
        await insert(2, "yoni");
        await insert(3, "yael");
    }, type);

    var x = await c.find();
    expect(x[0].id).toBe(1);
    expect(x[1].id).toBe(3);
    expect(x[2].id).toBe(2);
    var x = await c.find({ orderBy: {} });
    expect(x[0].id).toBe(1);
    expect(x[1].id).toBe(3);
    expect(x[2].id).toBe(2);
    var x = (await c.query({ orderBy: {}, pageSize: 100 }).paginator()).items;
    expect(x[0].id).toBe(1);
    expect(x[1].id).toBe(3);
    expect(x[2].id).toBe(2);
}, false)
testAllDbs("put with validation works", async ({ createData, remult }) => {
    let count = 0;
    let type = class extends newCategories { };
    Entity<typeof type.prototype>(undefined, {
        allowApiCrud: true,
        saving: () => {
            if (!testConfiguration.restDbRunningOnServer)
                count++;
        }
    })(type);
    let c = await createData(async insert =>
        await insert(1, 'noam'), type);


    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
        d.ok();
    };
    count = 0;
    await api.put(t, 1, {
        categoryName: 'noam 1'
    });
    d.test();
    var x = await c.find({
        where: { id: 1 }
    });

    expect(x[0].categoryName).toBe('noam 1');
    expect(count).toBe(1);
});
testAll("saves correctly to db", async ({ createEntity }) => {
    let type = class extends EntityBase {
        id: number;
        ok: Boolean = false;
    }
    Entity('asdf', { allowApiCrud: true })(type);
    Fields.number()(type.prototype, 'id');
    Fields.boolean()(type.prototype, "ok");
    let r = (await createEntity(type)).create();
    r.id = 1;
    r.ok = true;
    await r._.save();
    expect(r.ok).toBe(true);
    r.ok = false;
    await r._.save();
    expect(r.ok).toBe(false);
});

@Entity("autoi", { allowApiCrud: true })
class autoIncrement extends EntityBase {
    @Fields.autoIncrement()
    id: number;
    @Fields.integer()
    stam: number;
}

testAll("auto increment can't be affected by insert or update", async ({ createEntity }) => {
    let repo = await createEntity(autoIncrement);
    let r = await repo.create({ id: 1234, stam: 1 }).save();
    let x = r.id;
    expect(x == 1234).toBe(false);

    r.id = 4321;
    await r.save();
    expect(r.id).toBe(x);
}, false)

testAll("Paging",
    async ({ createEntity }) => {
        let s = await entityWithValidations.create4RowsInDp(createEntity);
        expect((await s.find({ limit: 3, orderBy: { myId: "asc" } })).length).toBe(3);
        expect((await s.find({ limit: 3, orderBy: { myId: "asc" }, page: 2 })).length).toBe(1);
    }, false);


testAll("filter", async ({ createEntity }) => {
    const s = await createEntity(testFilter);
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' });
    expect(await s.count({
        a: 'z',
        $and: [testFilter.search('')]

    })).toBe(0);
}, false);

testAll("large string field", async ({ createEntity }) => {
    const s = await createEntity(stam);
    await s.insert({ title: "1234567890".repeat(100) });
    const r = await s.findFirst();
    expect(r.title).toBe("1234567890".repeat(100));
}, false)



@Entity("testfilter", { allowApiCrud: true })
class testFilter {
    @Fields.integer()
    id: number = 0;
    @Fields.string()
    a: string = '';
    @Fields.string()
    b: string = '';
    @Fields.string()
    c: string = '';
    static search = Filter.createCustom<testFilter, string>((remult, str) => ({
        $and: [{
            $or: [
                { a: 'a' },
                { b: 'a' },
                { c: 'a' }
            ]
        }]
    }))
}









@Entity('teststringWithNull', { allowApiCrud: true })
class testStringWithNull extends EntityBase {
    @Fields.integer()
    id: number = 0;
    @Fields.string({ allowNull: true })
    d: string;
}



@Entity("a", { allowApiCrud: true })
export class stam extends EntityBase {
    @Fields.integer()
    id: number = 0;
    @Fields.string({ maxLength: 1500 })
    title: string = '';
}


@Entity('p', { allowApiCrud: true })
class p extends EntityBase {
    @Fields.integer()
    id: number;
    @Fields.string()
    name: string;
    @Field(() => c)
    c: c;
    constructor(private remult: Remult) {
        super();
    }
}



@Entity('tasksWithEnum', {
    allowApiCrud: true
})
export class tasksWithEnum extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Fields.object()
    priority = Priority.Low;
}

export enum Priority {
    Low,
    High,
    Critical
}
testAll("task with enum", async ({ createEntity }) => {
    const r = await createEntity(tasksWithEnum);
    await r.insert({
        title: 'a',
        priority: Priority.Critical
    });
    const item = await r.findFirst();
    expect(item.priority).toBe(Priority.Critical);
    expect(await r.count({ priority: Priority.Critical })).toBe(1)
    expect(await r.count({ priority: Priority.Low })).toBe(0)
});

@Entity('tasksWithStringEnum', {
    allowApiCrud: true
})
export class tasksWithStringEnum extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Fields.object()
    priority = PriorityWithString.Low;
}

export enum PriorityWithString {
    Low = "Low",
    High = "High",
    Critical = "Critical"
}
testAll("task with enum string", async ({ createEntity }) => {
    const r = await createEntity(tasksWithStringEnum);
    await r.insert({
        title: 'a',
        priority: PriorityWithString.Critical
    });
    const item = await r.findFirst();
    expect(item.priority).toBe(PriorityWithString.Critical);
    expect(await r.count({ priority: PriorityWithString.Critical })).toBe(1)
    expect(await r.count({ priority: PriorityWithString.Low })).toBe(0)
});
testAll("test transaction rollback", async ({ db }) => {
    let fail = true;
    try {
        await db.transaction(async () => {
            throw "error"
        });
        fail = false;
    }
    catch {

    }
    expect(fail).toBe(true);
})
