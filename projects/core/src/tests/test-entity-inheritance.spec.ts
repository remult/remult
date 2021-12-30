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
    @Field<parent>({ saving: self => { self.autoSavedField = "auto" } })
    autoSavedField: string = '';
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
    expect(x.autoSavedField).toBe("auto");

})
it("test saving of delete", async () => {
    let remult = new Remult(new InMemoryDataProvider());
    let x = await remult.repo(child).create().save();
    await x.delete();
    let done = false;
    try {
        await x.save();
        done = true;
    } catch (err) { }
    expect(done).toBe(false);
});

@Entity<anError>("error", {
    saving: async self => {
        if (!self.isNew() && self.name == '2') {
            self.name = '3';
            await self.save();
        }
    }
})
export class anError extends EntityBase {
    @Field()
    id: number = 0;
    @Field()
    name: string = '';
}
it("test error on save within saving", async () => {
    let remult = new Remult(new InMemoryDataProvider());
    let x = await remult.repo(anError).create({ id: 1, name: '1' }).save();
    x.name = '2';
    let done = false;
    try {
        await x.save();
        done = true;
    } catch (err) { }
    expect(done).toBe(false);
});