import { Entity, EntityBase, Field, Fields } from "../remult3";
import { testAll } from "./db-tests-setup";
import { deleteAll } from "./deleteAll";


@Entity('testNull', { allowApiCrud: true })
class testNull extends EntityBase {
    @Fields.integer()
    id: number = 0;

    @Field(undefined, { allowNull: true })
    myCol?: {
        value: string
    }

}

testAll("test that update null works", async ({ createEntity }) => {
    let r = await createEntity(testNull);
    let i = r.create({ id: 1, myCol: { value: 'abc' } });
    await i.save();
    expect(i.myCol?.value).toBe("abc");
    i.myCol = null;
    expect(i.myCol).toBe(null);
    await i.save();
    expect(i.myCol).toBe(null);
}, false);