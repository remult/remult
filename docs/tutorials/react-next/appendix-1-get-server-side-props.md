# Appendix 1 - Server-side Rendering, getServerSideProps & handlers

Next.js allow for pre-rendering page content using Server-side Rendering (SSR).

It is done by defining a function with the special name `getServerSideProps`. That function will be called on the backend and it's result will be sent to the function component.

Let's adjust the `index.tsx` code to get the page rendered on the server, including the list of tasks - using `getServerSideProps`

```tsx{3-4,6-12,15,17,21}
// src/pages/index.tsx

import { InferGetServerSidePropsType } from "next"
import remultApi from "./api/[...remult]"
//...
export const getServerSideProps = remultApi.getServerSideProps(async req => {
  return {
    props: {
      tasks: await fetchTasks()
    }
  }
})

export default function Home(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const [tasks, setTasks] = useState<Task[]>(props.tasks)
  //...
  useEffect(() => {
    if (session.status === "unauthenticated") signIn()
    //else fetchTasks().then(setTasks); <-- Delete this line
  }, [session])
}
```

1. We wrap the implementation of the `getServerSideProps` with a call to remultApi's `getServerSideProps` method that gets the function as a parameter.
   This method makes sure that the request is processed with a valid remult object that is already configured according the the user of the request.

2. We use the `InferGetServerSidePropsType` type from next, to infer the return value of the `getServerSideProps` function

3. We set the initial `tasks` state with the tasks received in the props

4. In the `useEffect` method we remove the call to `fetchTasks` since these tasks are already received in the props.

## Applying Access Rules

The `getServerSideProps` runs on the backend, and is not subject to the `apiAllowed` rules - so we'll need to do that ourselves based on the metadata of the entity

```ts{4}
export const getServerSideProps = remultApi.getServerSideProps(async req => {
  return {
    props: {
      tasks: taskRepo.metadata.apiReadAllowed ? await fetchTasks() : []
    }
  }
})
```

## Using remult in a next.js api handler

To use `remult` in a `next.js` handler, we need to wrap the function with remult's `handle` method

```ts
// src/pages/taskCount.ts

import { remult } from "remult"
import { Task } from "../../shared/tasks"
import api from "./[...remult]"

export default api.handle(async (req, res) => {
  const taskRepo = remult.repo(Task)
  res.json({
    total: await taskRepo.count(),
    completed: await taskRepo.count({ completed: true })
  })
})
```

When using remult from a `next.js` api handler, you may get the error:
`Error: remult object was requested outside of a valid context, try running it within initApi or a remult request cycle`
