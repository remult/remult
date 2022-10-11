# CRUD Operations

## Rename Tasks and Mark as Completed

To make the tasks in the list updatable, we'll bind the `input` elements to the `Task` properties and add a *Save* button to save the changes to the backend database.


*src/App.vue*
```vue{16-19,28-29}
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { remult } from 'remult';
import { Task } from './shared/Task';

const taskRepo = remult.repo(Task);
const tasks = ref<Task[]>([]);
const hideCompleted = ref(false);
async function fetchTasks() {
  tasks.value = await taskRepo.find({
    limit: 20,
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
  });
}
async function saveTask(task: Task) {
  const savedTask = await taskRepo.save(task);
  tasks.value = tasks.value.map(t => t === task ? savedTask : t);
}
onMounted(() => fetchTasks())
</script>
<template>
  <div>
    <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed
    <main>
      <div v-for="task in tasks">
        <input type="checkbox" v-model="task.completed" />
        <input v-model="task.title" />
        <button @click="saveTask(task)">Save</button>
      </div>
    </main>
  </div>
</template>
```

::: warning Why update the task array after saving a task?
Remult's `Repository.save` method issues either a `PUT` or a `POST` request, depending on the existence of an `id` value in the `Task` object. 

In the next section of the tutorial, we'll add new tasks to the list by creating `Task` objects and saving them using the same `saveTask` function. So, to make sure a newly created task is only `POST`-ed once, we must replace it with the return value of `Repository.save`, which contains an `id`.
:::

After the browser refreshes, the tasks can be renamed and marked as completed.

Make some changes and refresh the browser to verify the backend database is updated.
## Add New Tasks

Add the highlighted `addTask` function and *Add Task* `button` to the `App` component:

*src/App.vue*
```vue{20-22,35}
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { remult } from 'remult';
import { Task } from './shared/Task';

const taskRepo = remult.repo(Task);
const tasks = ref<Task[]>([]);
const hideCompleted = ref(false);
async function fetchTasks() {
  tasks.value = await taskRepo.find({
    limit: 20,
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
  });
}
async function saveTask(task: Task) {
  const savedTask = await taskRepo.save(task);
  tasks.value = tasks.value.map(t => t === task ? savedTask : t);
}
function addTask() {
  tasks.value.push(new Task());
}
onMounted(() => fetchTasks())
</script>
<template>
  <div>
    <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed
    <main>
      <div v-for="task in tasks">
        <input type="checkbox" v-model="task.completed" />
        <input v-model="task.title" />
        <button @click="saveTask(task)">Save</button>
      </div>
    </main>
    <button @click="addTask()">Add Task</button>
  </div>
</template>
```

Add a few tasks and refresh the browser to verify the backend database is updated.

::: warning Note 
New tasks **will not be saved to the backend** until you press the *Save* button.
:::

## Delete Tasks

Let's add a *Delete* button next to the *Save* button of each task in the list.

Add the highlighted `deleteTask` function and *Delete* `button` Within the `tasks.map` iteration in the `return` section of the `App` component.

*src/App.vue*
```vue{23-26,37}
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { remult } from 'remult';
import { Task } from './shared/Task';

const taskRepo = remult.repo(Task);
const tasks = ref<Task[]>([]);
const hideCompleted = ref(false);
async function fetchTasks() {
  tasks.value = await taskRepo.find({
    limit: 20,
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
  });
}
async function saveTask(task: Task) {
  const savedTask = await taskRepo.save(task);
  tasks.value = tasks.value.map(t => t === task ? savedTask : t);
}
function addTask() {
  tasks.value.push(new Task());
}
async function deleteTask(task: Task) {
  await taskRepo.delete(task);
  tasks.value = tasks.value.filter(t => t !== task);
}
onMounted(() => fetchTasks())
</script>
<template>
  <div>
    <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed
    <main>
      <div v-for="task in tasks">
        <input type="checkbox" v-model="task.completed" />
        <input v-model="task.title" />
        <button @click="saveTask(task)">Save</button>
        <button @click="deleteTask(task)">Delete</button>
      </div>
    </main>
    <button @click="addTask()">Add Task</button>
  </div>
</template>
```