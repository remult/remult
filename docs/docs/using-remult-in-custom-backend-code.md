# Using remult in custom backend code
When using [BackendMethods](./backendMethods.md), remult automatically injects the `Remult` object to the method. Still, there are many use cases where you may want to create your own express endpoints without using `BackendMethods` but would still want to take advantage of `Remult` as an ORM and use it to check for user validity, etc...

Here's an example of how to do that:
```ts
app.post('/api/customSetAll', async (req, res) => {
    const remult = await api.getRemult(req);
    if (!remult.authenticated()){
        res.sendStatus(403);
        return;
    }
    if (!remult.isAllowed("admin")){
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
