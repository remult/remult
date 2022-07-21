
import axios from 'axios';
import { HttpProviderBridgeToRestDataProviderHttpProvider, Remult } from '../context';
import { Entity, Fields } from '../remult3';
import { Action, BackendMethod } from '../server-action';

Remult.apiBaseUrl = 'http://localhost:3003/api';
let path = Remult.apiBaseUrl + '/tasks';
const environments = [
    ["next", 3000],
    ["koa", 3002],
    ["express", 3003],
    ["fastify", 3004],
    ["middleware", 3005],
    ["optine", 3006],
    ["fresh", 8000]
]


function test(name: string, test: () => Promise<void>) {

    for (const [env, port] of environments) {

        const theTest = async () => {
            Remult.apiBaseUrl = `http://localhost:${port}/api`;
            path = Remult.apiBaseUrl + '/tasks';
            await test();
        };
        const testName = env + ` ${port}: ${name}`;
        fit(testName, theTest);
    }
}

test("works", async () => {
    const repo = await create3Tasks();
    const tasks = await repo.find({ where: { completed: true } });
    expect(tasks.length).toBe(1);
    await repo.save({ ...tasks[0], completed: false });
    expect(await repo.count({ completed: true })).toBe(0);
});
test("test multiple items", async () => {
    const repo = await create3Tasks();
    expect(await repo.count({
        title: { "!=": ["a", "c"] }
    })).toBe(1);

});
test("validation", async () => {
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

test("forbidden", async () => {
    let err = undefined;
    try {
        await Task.testForbidden();
    }
    catch (error: any) {
        err = error;
    }
    expect(err.httpStatusCode).toEqual(403)
});
test("test http 404", async () => {
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
test("test http 201", async () => {
    let result = await axios.post<{ title: string, id: string }>(
        path
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



