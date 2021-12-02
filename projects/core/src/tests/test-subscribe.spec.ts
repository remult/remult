import { InMemoryDataProvider } from "../..";
import { Remult } from "../context";
import { Entity, EntityBase, Field } from "../remult3";
import { Validators } from "../validators";

describe("test subscribe", () => {
    it("basics", async () => {
        let repo = new Remult(new InMemoryDataProvider()).repo(myEntity);
        for (const del of await repo.find()) {
            await del.delete();
        }
        let state = {
            title: '',
            wasChanged: false,
            isNew: false,
            error: '',
            titleError: ''
        };
        let i = repo.create();
        let r = i._.subscribe(() => {
            state.title = i.title;
            state.wasChanged = i._.wasChanged();
            state.isNew = i._.isNew();
            state.error = i._.error;
            state.titleError = i.$.title.error;
        });
        i.title = 'a';
        expect(state.title).toBe('a');
        i.title = 'ab';
        expect(state.title).toBe("ab");
        expect(state.wasChanged).toBe(true);
        expect(state.isNew).toBe(true);
        let x = i.save();
        expect(i._.isLoading).toBe(true);
        await x;
        expect(i._.isLoading).toBe(false);
        expect(state.title).toBe('ab');
        expect(state.wasChanged).toBe(false);
        expect(state.isNew).toBe(false);
        i.$.title.error = 'error';
        expect(state.titleError).toBe('error');
        i._.error = "error";
        expect(state.error).toBe('error');

    });
    it("observed", async () => {
        let repo = new Remult(new InMemoryDataProvider()).repo(myEntity);
        for (const del of await repo.find()) {
            await del.delete();
        }
        let i = repo.create();
        let observed = false;
        i._.subscribe({
            reportChanged: () => { },
            reportObserved: () => observed = true
        });

        function testObserved(what: () => void) {
            observed = false;
            what();
            expect(observed).toBe(true);
        }
        testObserved(() => { i.title.toString() });
        testObserved(() => { i.$.title.valueChanged() });
        testObserved(() => { i.isNew() });
        testObserved(() => { i._.wasChanged() });


    });
    it("refInitWorks", async () => {
        let repo = new Remult(new InMemoryDataProvider()).repo(myEntity);
        for (const del of await repo.find()) {
            await del.delete();
        }
        entityRefInitCount = 0;
        let remultInitCount = 0;
        Remult.entityRefInit = () => remultInitCount++;

        let i = repo.create({ title: "a" });
        expect(entityRefInitCount).toBe(1);
        expect(remultInitCount).toBe(1);
        await i.save();
        expect(entityRefInitCount).toBe(1);
        expect(remultInitCount).toBe(1);
        Remult.entityRefInit;
    });

})
let entityRefInitCount = 0;
@Entity("theEntity", {
    allowApiCrud: true,
    entityRefInit: () => entityRefInitCount++
})
class myEntity extends EntityBase {
    @Field({
        validate: Validators.required
    })
    title: string = '';
}