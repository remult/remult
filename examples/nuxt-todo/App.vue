<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { remult, type UserInfo } from 'remult'
import { Task } from './shared/task'
import { TasksController } from './shared/tasksController'

const { status, data, signIn, signOut, refresh } = await useAuth({
  required: false,
})
const taskRepo = remult.repo(Task)
const tasks = ref<Task[]>([])
onMounted(() => {
  remult.user = data.value?.user as UserInfo
  if (status.value === 'unauthenticated') signIn()
  else if (status.value === 'authenticated')
    return onUnmounted(
      taskRepo
        .liveQuery({
          limit: 20,
          orderBy: { createdAt: 'asc' },
          // where: { completed: true },
        })
        .subscribe((info) => (tasks.value = info.applyChanges(tasks.value))),
    )
})
const newTaskTitle = ref('')
async function addTask() {
  try {
    const newTask = await taskRepo.insert({ title: newTaskTitle.value })
    newTaskTitle.value = ''
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
    await taskRepo.delete(task)
  } catch (error) {
    alert((error as { message: string }).message)
  }
}
async function setAllCompleted(completed: boolean) {
  TasksController.setAllCompleted(completed)
}
</script>
<template>
  <ClientOnly>
    <div v-if="status === 'authenticated'">
      <h1>todos</h1>
      <main>
        <div>
          Hello {{ remult.user.name }}
          <button @click="signOut()">Sign Out</button>
        </div>

        <form
          @submit.prevent="addTask()"
          v-if="taskRepo.metadata.apiInsertAllowed()"
        >
          <input v-model="newTaskTitle" placeholder="What needs to be done?" />
          <button>Add</button>
        </form>
        <div v-for="task in tasks" v-bind:key="task.id">
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
          <button @click="setAllCompleted(false)">
            Set All as Uncompleted
          </button>
        </div>
      </main>
    </div>
  </ClientOnly>
</template>
