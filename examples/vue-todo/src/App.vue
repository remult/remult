<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import { remult } from "remult"
import { Task } from "./shared/Task"
import { TasksController } from "./shared/TasksController"

const taskRepo = remult.repo(Task)
const tasks = ref<Task[]>([])
onMounted(() =>
  onUnmounted(
    taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { createdAt: "asc" },
        // where: { completed: true },
      })
      .subscribe((info) => (tasks.value = info.applyChanges(tasks.value)))
  )
)
const newTaskTitle = ref("")
async function addTask() {
  try {
    const newTask = await taskRepo.insert({ title: newTaskTitle.value })
    //tasks.value.push(newTask)
    newTaskTitle.value = ""
  } catch (error) {
    alert((error as { message: string }).message)
  }
}
async function saveTask(task: Task) {
  try {
    await taskRepo.save(task)
  } catch (error) {
    alert((error as { message: string }).message)
  }
}
async function deleteTask(task: Task) {
  try {
    //await taskRepo.delete(task)
    tasks.value = tasks.value.filter((t) => task !== t)
  } catch (error) {
    alert((error as { message: string }).message)
  }
}
async function setAllCompleted(completed: boolean) {
  TasksController.setAllCompleted(completed)
}
</script>
<template>
  <div>
    <h1>todos</h1>
    <main>
      <form
        @submit.prevent="addTask()"
        v-if="taskRepo.metadata.apiInsertAllowed()"
      >
        <input v-model="newTaskTitle" placeholder="What needs to be done?" />
        <button>Add</button>
      </form>
      <div v-for="task in tasks">
        <input
          type="checkbox"
          v-model="task.completed"
          @change="saveTask(task)"
        />
        <input v-model="task.title" />
        <button @click="saveTask(task)">Save</button>
        <button
          v-if="taskRepo.metadata.apiDeleteAllowed(task)"
          @click="deleteTask(task)"
        >
          Delete
        </button>
      </div>
      <div>
        <button @click="setAllCompleted(true)">Set All as Completed</button>
        <button @click="setAllCompleted(false)">Set All as Uncompleted</button>
      </div>
    </main>
  </div>
</template>
./shared/Task
