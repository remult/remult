<template>
  <Tile :title="'Server Status'" :status="status" :subtitle="subtitle">
    <template v-if="status === 'Error'">
      <p v-html="errorMessage"></p>
    </template>
    <template v-else-if="status === 'Loading'">
      <p>Looking for the server...</p>
    </template>
    <template v-else>
      <p>
        Everything sparkling! API is ready to be consumed. Find more information
        in the
        <a target="_blank" href="https://remult.dev/docs/rest-api">docs</a>.
      </p>
    </template>
  </Tile>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { remult } from "remult";
import Tile from "./Tile.vue";
type TileStatus = "Success" | "Error" | "Warning" | "Info" | "Loading";

const status = ref<TileStatus>("Loading");
const errorMessage = ref<string | undefined>(undefined);

onMounted(() => {
  remult
    .initUser()
    .then(() => {
      status.value = "Success";
    })
    .catch((e) => {
      status.value = "Error";

      if (e.message?.includes("the server configuration")) {
        errorMessage.value = `
          Make sure to set the <code>BETTER_AUTH_SECRET</code> in the <code>.env</code> file. <br />
          Read more at <a href="https://www.better-auth.com/docs/reference/options#secret" target="_blank">better-auth docs</a>.
        `;
      } else {
        errorMessage.value = `
          Please run <code>npm run dev-node</code> in a separate terminal.
        `;
      }
    });
});

const subtitle = computed(() => {
  return status.value === "Success"
    ? "Up and running"
    : status.value === "Error"
      ? "There seems to be an issue"
      : status.value;
});
</script>

<style scoped>
/* Add any necessary styling */
</style>
