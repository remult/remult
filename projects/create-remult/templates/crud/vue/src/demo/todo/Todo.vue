<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { remult } from "remult";
import { Task } from "./Task";

const taskRepo = remult.repo(Task);
const tasks = ref<Task[]>([]);
const page = ref(1);
const fetchTasks = async () => {
  tasks.value = await taskRepo.find({
    page: page.value,
    limit: 5,
  });
};
onMounted(fetchTasks);
watch(page, fetchTasks);

const newTaskTitle = ref("");
async function addTask() {
  try {
    const newTask = await taskRepo.insert({ title: newTaskTitle.value });
    tasks.value.push(newTask);
    newTaskTitle.value = "";
  } catch (error: unknown) {
    alert((error as { message: string }).message);
  }
}
async function saveTask(task: Task) {
  try {
    await taskRepo.save(task);
  } catch (error: unknown) {
    alert((error as { message: string }).message);
  }
}
async function deleteTask(task: Task) {
  try {
    await taskRepo.delete(task);
    tasks.value = tasks.value.filter((t) => task !== t);
  } catch (error: unknown) {
    alert((error as { message: string }).message);
  }
}
</script>
<template>
  <div>
    <h1>Todos</h1>
    <main>
      <form @submit.prevent="addTask()">
        <input v-model="newTaskTitle" placeholder="What needs to be done?" />
        <button>Add</button>
      </form>
      <div v-for="task in tasks">
        <input
          type="checkbox"
          v-model="task.completed"
          @change="saveTask(task)"
        />
        {{ task.title }}
        <button @click="deleteTask(task)">Delete</button>
      </div>
    </main>
    <footer>
      <button @click="page--" :disabled="page <= 1">Previous</button>
      <span>Page {{ page }}</span>
      <button @click="page++">Next</button>
    </footer>
  </div>
</template>
