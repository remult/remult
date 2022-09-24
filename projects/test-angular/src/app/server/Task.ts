import { Entity, Fields } from '../../../../core/src/remult3';
import { Validators } from '../../../../core/src/validators';
import { BackendMethod } from '../../../../core/src/server-action';
import { dbNamesOf } from '../../../../core/src/filter/filter-consumer-bridge-to-sql-request';
import { remult } from '../../../../core/src/remult-proxy';
import { SqlDatabase } from '../../../../core/src/data-providers/sql-database';
import { KnexDataProvider } from '../../../../core/remult-knex';




@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: number;

    @Fields.string({
        validate: Validators.required
    })
    title = '';

    @Fields.boolean()
    completed = false;
    @BackendMethod({ allowed: false })
    static testForbidden() {
    }
}

async function test() {
const tasks = await dbNamesOf(remult.repo(Task));
const knex = await KnexDataProvider.getDb();
console.table(
    await knex(tasks.$entityName).select(tasks.title,tasks.completed));
}