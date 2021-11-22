import { InMemoryDataProvider } from "../..";
import { Remult } from "../context";
import { Entity, EntityBase, Field, IntegerField } from "../remult3";

describe("test", () => {
    it("test1",async () => {
        let remult = new Remult(new InMemoryDataProvider());
        remult.repo(test).create().save();
        expect(await remult.repo(test).count()).toBe(1);

    })
});

@Entity("test")
class test extends EntityBase {
    @IntegerField()
    id: number;
    @Field()
    name: string = '';
}
