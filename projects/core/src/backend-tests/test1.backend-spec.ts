import { IdEntity } from "../..";
import { Remult } from "../context";
import { Entity, Field } from "../remult3";
import { KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';
describe("test", () => {
    let remult: Remult;
    let knex: Knex.Knex;
    beforeAll(async () => {
        config();
        knex =
            Knex.default({
                client: 'pg',
                connection: process.env.DATABASE_URL
            });
        remult = new Remult(new KnexDataProvider(knex));

    });
    beforeEach(async () => {
        await knex("tasks").delete();
    });
    it("test1", async () => {
        await knex("tasks").insert({ id: 'a', title: 'noam', completed: false });
        let z = await knex("tasks").count();
        expect(z[0].count).toBe('1');
        expect(await remult.repo(Task).count()).toBe(1);
        let t = await remult.repo(Task).find();
        expect(t.length).toBe(1);
        expect(t[0].id).toBe('a');
        expect(t[0].title).toBe('noam');
        expect(t[0].completed).toBe(false);
    })
    fit("test2", async () => {
        await knex("tasks").insert({ id: 'a', title: 'noam', completed: false });
        expect((await remult.repo(Task).find({ where: { id: 'b' } })).length).toBe(0);
        expect((await remult.repo(Task).find({ where: { id: 'a' } })).length).toBe(1);
    })

});

@Entity("tasks", {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Field()
    title: string = '';
    @Field()
    completed: boolean = false;
}