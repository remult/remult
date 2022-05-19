# CRUD Operations

## Rename Tasks and Mark as Completed

To make the tasks in the list updatable, we'll bind the `input` elements to the `Task` properties and add a *Save* button to save the changes to the backend database.


*src/App.vue*
```vue{15-17,24-26}
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { remult } from './common';
import { Task } from './shared/Task';

const taskRepo = remult.repo(Task);
const tasks = ref<Task[]>([]);
const hideCompleted = ref(false);
async function fetchTasks() {
  tasks.value = await taskRepo.find({
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
  });
}
async function saveTask(task: Task) {
  taskRepo.save(task);
}
onMounted(() => fetchTasks())
</script>
<template>
  <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed {{ hideCompleted }}
  <hr />
  <div v-for="task in tasks">
    <input type="checkbox" v-model="task.completed" />
    <input v-model="task.title" />
    <button @click="saveTask(task)">Save</button>
  </div>
</template>
```

   The `handleChange` function simply replaces the `tasks` state with a new array containing all unchanged tasks and a new version of the current task that includes the modified `values`.

   After the browser refreshes, the tasks can be renamed and marked as completed.



Make some changes and refresh the browser to verify the backend database is updated.
## Add New Tasks

Add the highlighted `addTask` function and *Add Task* `button` to the `App` component:

*src/App.vue*
```vue{18-20,31}
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { remult } from './common';
import { Task } from './shared/Task';

const taskRepo = remult.repo(Task);
const tasks = ref<Task[]>([]);
const hideCompleted = ref(false);
async function fetchTasks() {
  tasks.value = await taskRepo.find({
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
  });
}
async function saveTask(task: Task) {
  taskRepo.save(task);
}
function addTask() {
  tasks.value.push(new Task());
}
onMounted(() => fetchTasks())
</script>
<template>
  <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed {{ hideCompleted }}
  <hr />
  <div v-for="task in tasks">
    <input type="checkbox" v-model="task.completed" />
    <input v-model="task.title" />
    <button @click="saveTask(task)">Save</button>
  </div>
  <button @click="addTask()">Add Task</button>
</template>
```

Add a few tasks and refresh the browser to verify the backend database is updated.

::: warning Note 
New tasks **will not be saved to the backend** until you press the *Save* button.
:::

::: danger Wait, there's a bug in this code
Notice that if you add a new task by clicking the *Add Task* button, click the *Save* button **multiple times**, and then refresh the browser, **multiple tasks will be added to the list instead of only one**.

This is happening because the Remult `Repository.save` method issues either a `PUT` or a `POST` request, depending on the existence of an `id` value in the `Task` object. 

To fix the bug, modify the `saveTask` function and replace the saved task in the `tasks` array with the object returned from `Repository.save` (which contains the `id` of the task created in the backend).

*src/App.vue*
```ts
async function saveTask(task: Task) {
  const savedTask = await taskRepo.save(task);
  tasks.value = tasks.value.map(t => t === task ? savedTask : t);
}
```
:::

## Delete Tasks

Let's add a *Delete* button next to the *Save* button of each task in the list.

Add the highlighted `deleteTask` function and *Delete* `button` Within the `tasks.map` iteration in the `return` section of the `App` component.

*src/App.vue*
```vue{22-25,35}
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { remult } from './common';
import { Task } from './shared/Task';

const taskRepo = remult.repo(Task);
const tasks = ref<Task[]>([]);
const hideCompleted = ref(false);
async function fetchTasks() {
  tasks.value = await taskRepo.find({
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
  <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed {{ hideCompleted }}
  <hr />
  <div v-for="task in tasks">
    <input type="checkbox" v-model="task.completed" />
    <input v-model="task.title" />
    <button @click="saveTask(task)">Save</button>
    <button @click="deleteTask(task)">Delete</button>
  </div>
  <button @click="addTask()">Add Task</button>
</template>
```