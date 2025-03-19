<script lang="ts">
  import { repo } from "remult";
  import { Task } from "../shared/Task";

  let tasks = $state<Task[]>([]);
  let newTaskTitle = $state("");

  // Load tasks
  $effect(() => {
    repo(Task).find().then(t => tasks = t);
  });

  // Add task
  const addTask = async (event: Event) => {
    event.preventDefault();
    if (newTaskTitle.trim()) {
      const newTask = await repo(Task).insert({ title: newTaskTitle });
      tasks = [...tasks, newTask];
      newTaskTitle = "";
    }
  };
</script>

<form onsubmit={addTask}>
  <input bind:value={newTaskTitle} placeholder="What needs to be done?" />
  <button>Add</button>
</form>

{#each tasks as task}
  {task.title}
{/each} 