<template>
  <Tile
    title="Todos"
    subtitle="Fully functional todo app"
    icon=""
    width="full"
    class="todo"
  >
    <main>
      <form @submit.prevent="addTask">
        <input
          type="text"
          v-model="newTaskTitle"
          placeholder="What needs to be done?"
        />
        <button>
          <img :src="plusIcon" alt="Add" />
        </button>
      </form>
      <div v-if="tasks.length > 0">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="todo__task"
          :class="{ completed: task.completed }"
          @click="setCompleted(task, !task.completed)"
        >
          <input
            type="checkbox"
            :checked="task.completed"
            @click.stop
            @change="(e) => handleCheckboxChange(e, task)"
          />
          <span>{{ task.title }}</span>
          <button @click.stop="deleteTask(task)">
            <img :src="trashIcon" alt="Delete" />
          </button>
        </div>
      </div>
      <p v-else class="todo__empty">
        There is nothing to do right now, try adding some todos.
      </p>
      <div class="button-row">
        <button @click="toggleHideCompleted">
          {{ hideCompleted ? "Show" : "Hide" }} completed
        </button>
      </div>
    </main>
  </Tile>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { repo } from "remult";
import Tile from "../Tile.vue";
import { Task } from "./Task";
import plusIcon from "../../assets/plus.svg";
import trashIcon from "../../assets/trash.svg";

const tasks = ref<Task[]>([]);
const hideCompleted = ref(false);
const newTaskTitle = ref("");

const fetchTasks = async () => {
  const fetchedTasks = await repo(Task).find({
    where: hideCompleted.value ? { completed: false } : undefined,
    orderBy: { createdAt: "desc" },
  });
  tasks.value = fetchedTasks;
};

onMounted(fetchTasks);

watch(hideCompleted, fetchTasks);

const toggleHideCompleted = () => {
  hideCompleted.value = !hideCompleted.value;
};

const addTask = async (e: Event) => {
  e.preventDefault();
  try {
    const newTask = await repo(Task).insert({ title: newTaskTitle.value });
    tasks.value = [newTask, ...tasks.value];
    newTaskTitle.value = "";
  } catch (error: any) {
    alert((error as { message: string }).message);
  }
};

const setCompleted = async (task: Task, completed: boolean) => {
  await repo(Task).update(task.id, { completed });
  task.completed = completed;
  tasks.value = [...tasks.value];
};
const handleCheckboxChange = (e: Event, task: Task) => {
  const target = e.target as HTMLInputElement;
  setCompleted(task, target.checked);
};

const deleteTask = async (task: Task) => {
  await repo(Task).delete(task.id);
  tasks.value = tasks.value.filter((t) => t.id !== task.id);
};
</script>

<style scoped>
.todo__task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;
}

.completed {
  text-decoration: line-through;
}

.button-row {
  margin-top: 20px;
}
</style>
