import { InMemoryDataProvider } from "../..";
import { Remult } from "../context";
import { Entity, EntityBase, Field } from "../remult3";


@Entity<parent>("parent", {
    saving: self => {
        self.myField += ",parent";
    }
})
export class parent extends EntityBase {
    @Field()
    id: number = 0;
    @Field()
    myField: string = '';
}
@Entity<child>("child", {
    saving: self => {
        self.myField += "child";
    }
})
export class child extends parent {

}

it("saving works well ", async () => {
    let remult = new Remult(new InMemoryDataProvider());
    let x = await remult.repo(child).create().save();
    expect(x.myField).toBe("child,parent");

})