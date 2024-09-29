<script setup lang="ts">
import { ref, onMounted } from "vue";

const status = ref<"⌛" | "✅" | "❌">("⌛");

onMounted(() => {
  fetch("/api/me")
    .then((x) => x.json())
    .then((x) => (status.value = x !== undefined ? "✅" : "❌"))
    .catch(() => (status.value = "❌"));
});
</script>

<template>
  <div>
    Api status:
    <template v-if="status === '❌'">
      {{ status }} Please run <code>npm run dev-node</code> in a separate
      terminal
    </template>
    <template v-else>
      {{ status }}
    </template>
  </div>
</template>
