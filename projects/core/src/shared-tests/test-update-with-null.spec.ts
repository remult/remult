import { Entity, EntityBase, Field } from "../remult3";
import { testAll } from "./db-tests-setup";


@Entity('testNull', { allowApiCrud: true })
class testNull extends EntityBase {
    @Field()
    id: number = 0;

    @Field({ allowNull: true })
    myCol?: {
        value: string
    }

}

testAll("test that update null works", async ({ remult }) => {
    let r = remult.repo(testNull);
    let i = r.create({ id: 1, myCol: { value: 'abc' } });
    await i.save();
    expect(i.myCol?.value).toBe("abc");
    i.myCol = null;
    expect(i.myCol).toBe(null);
    await i.save();
    expect(i.myCol).toBe(null);
});