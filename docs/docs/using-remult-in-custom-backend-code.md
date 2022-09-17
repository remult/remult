# Using remult in express routes
When using [BackendMethods](./backendMethods.md), `remult` is automatically available. Still, there are many use cases where you may want to create your own express endpoints without using `BackendMethods` but would still want to take advantage of `Remult` as an ORM and use it to check for user validity, etc...

If you tried to use the `remult` object, you may have got the error:
```sh
 Error: remult object was requested outside of a valid context, try running it within initApi or a remult request cycle
```

To get remult, simply use the `api.withRemult` middleware - that will initiate the `remult` object for you with the relevant request information

Here's an example of how to do that:
```ts{7}
const app = express();
...
const api = remultExpress({
    entities:[Task]
})
app.post('/api/customSetAll', api.withRemult, async (req, res) => {
    if (!remult.authenticated()) {
        res.sendStatus(403);
        return;
    }
    if (!remult.isAllowed("admin")) {
        res.sendStatus(403);
        return;
    }
    const taskRepo = remult!.repo(Task);
    for (const task of await taskRepo.find()) {
        task.completed = req.body.completed;
        await taskRepo.save(task);
    }
    res.send();
});
```