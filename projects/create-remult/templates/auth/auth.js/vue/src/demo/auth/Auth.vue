<template>
  <Tile
    title="Auth"
    :status="status"
    :subtitle="tileSubtitle"
    class="auth"
    width="half"
  >
    <template v-if="status === 'Loading'">
      <!-- Empty content since we only display the loading subtitle -->
    </template>
    <template v-else-if="status === 'Error'">
      <p v-html="errorMessage"></p>
    </template>
    <template v-else-if="authenticated">
      <p>
        You are authenticated as <strong>{{ remult.user?.name }}</strong>
      </p>
      <div class="button-row">
        <a class="button" href="/auth/signout">Sign Out</a>
      </div>
    </template>
    <template v-else>
      <p>You are currently not authenticated</p>
      <div class="button-row">
        <a class="button" href="/auth/signin">Sign In</a>
        <a class="button" target="_blank" href="https://authjs.dev"
          >Auth.js Docs</a
        >
      </div>
    </template>
  </Tile>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { remult } from "remult";
import Tile from "../Tile.vue";
type TileStatus = "Success" | "Error" | "Warning" | "Info" | "Loading";

const status = ref<TileStatus>("Loading");
const errorMessage = ref<string | undefined>(undefined);

const authenticated = computed(() => remult.authenticated());

const tileSubtitle = computed(() => {
  if (status.value === "Loading") {
    return "Checking your authentication status";
  } else if (status.value === "Error") {
    return "There seems to be an issue";
  } else if (authenticated.value) {
    return "";
  }
  return "";
});

onMounted(() => {
  remult
    .initUser()
    .then(() => {
      status.value = "Success";
    })
    .catch((e) => {
      status.value = "Error";
      if (e.message.includes("the server configuration")) {
        errorMessage.value = `
          Make sure to set the <code>AUTH_SECRET</code> in the <code>.env</code> file. <br />
          Read more at <a href="https://errors.authjs.dev#missingsecret" target="_blank">auth.js docs</a>.<br />
          Please check the server terminal console for more information.
        `;
      }
    });
});
</script>
