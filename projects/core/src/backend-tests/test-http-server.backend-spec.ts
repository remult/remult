
import axios from 'axios';
import { HttpProviderBridgeToRestDataProviderHttpProvider, Remult } from '../context';
import { Entity, Fields } from '../remult3';
import { Action, BackendMethod } from '../server-action';
import { Validators } from '../validators';

Remult.apiBaseUrl = 'http://localhost:3001/api';
const path = Remult.apiBaseUrl + '/tasks';

fit("works", async () => {
    const repo = await create3Tasks();
    const tasks = await repo.find({ where: { completed: true } });
    expect(tasks.length).toBe(1);
    await repo.save({ ...tasks[0], completed: false });
    expect(await repo.count({ completed: true })).toBe(0);
});
fit("test multiple items", async () => {
    const repo = await create3Tasks();
    expect(await repo.count({
        title: { "!=": ["a", "c"] }
    })).toBe(1);

});


fit("validation", async () => {
    const r = await create3Tasks();
    let err = undefined;
    try {
        await r.insert({ "title": "" });
    }
    catch (error: any) {
        err = error;
    }
    expect(err).toEqual({
        message: "Title: Should not be empty",
        httpStatusCode: 400,
        modelState: {
            title: "Should not be empty"
        }
    })
});
fit("forbidden", async () => {
    let err = undefined;
    try {
        await Task.testForbidden();
    }
    catch (error: any) {
        err = error;
    }
    expect(err).toEqual({
        httpStatusCode: 403
    })
});
fit("test http 404", async () => {
    const repo = create3Tasks();
    const task = await (await repo).findFirst();
    let result = await axios.get<{ id: string }>(path + "/" + task.id);
    expect(result.data.id).toBe(task.id);

    expect(result.status).toBe(200);
    let error = undefined;
    try {
        result = await axios.get(path + "/123");
    }

    catch (err: any) {
        error = err;
    }
    expect(error.response.status).toBe(404);
});
fit("test http 201", async () => {
    let result = await axios.post<{ title: string, id: string }>(
        'http://localhost:3001/api/tasks'
        , { title: "z", id: "" });
    expect(result.data.title).toBe("z");
    expect(result.status).toBe(201);
    result = await axios.delete(path + "/" + result.data.id);
    expect(result.status).toBe(204);
});



@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: string;

    @Fields.string({
        //  validate: Validators.required should only be on backend
    })
    title = '';

    @Fields.boolean()
    completed = false;
    @BackendMethod({ allowed: false })
    static testForbidden() {

    }
}

async function create3Tasks() {
    const remult = new Remult(axios);
    Action.provider = new HttpProviderBridgeToRestDataProviderHttpProvider(axios);
    const taskRepo = remult.repo(Task);
    for (const task of await taskRepo.find()) {
        await taskRepo.delete(task);
    }
    expect(await taskRepo.count()).toBe(0);
    await taskRepo.insert([{ title: "a" }, { title: "b", completed: true }, { title: "c" }]);
    expect(await taskRepo.count()).toBe(3);
    return taskRepo;
}
