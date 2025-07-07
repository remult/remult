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
        <br />
        <i>Roles:</i>
        {{ userRoles }}
      </p>
      <div class="button-row">
        <button class="button" @click="signOut">Sign Out</button>
      </div>
    </template>
    <template v-else>
      <p>You are currently not authenticated</p>
      <div v-if="messageError" class="message error">
        <p>{{ messageError }}</p>
      </div>
      <input type="text" v-model="name" placeholder="Name" />
      <input type="email" v-model="email" placeholder="Email" />
      <input type="password" v-model="password" placeholder="Password" />
      <div class="button-row">
        <button class="button" @click="signUp">Sign Up</button>
        <button class="button" @click="signIn">Sign In</button>
      </div>
      <div class="button-row">
        <a class="button" target="_blank" href="https://better-auth.com"
          >Better-Auth Docs</a
        >
      </div>
    </template>
  </Tile>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { remult } from "remult";
import Tile from "../Tile.vue";
import { authClient } from "./auth-client.js";

type TileStatus = "Success" | "Error" | "Warning" | "Info" | "Loading";

const status = ref<TileStatus>("Loading");
const errorMessage = ref<string | undefined>(undefined);
const messageError = ref<string>("");

const name = ref("");
const email = ref("");
const password = ref("");

const authenticated = computed(() => remult.authenticated());

const userRoles = computed(() => {
  const roles = remult.user?.roles ?? [];
  return roles.length > 0 ? roles.join(", ") : "-";
});

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

const signUp = async () => {
  try {
    const result = await authClient.signUp.email({
      email: email.value,
      password: password.value,
      name: name.value,
    });

    if (result.error) {
      messageError.value = result.error.message || "Sign up failed";
    } else {
      messageError.value = "";
      await remult.initUser();
      window.location.reload();
    }
  } catch (error) {
    messageError.value = "Sign up failed";
  }
};

const signIn = async () => {
  try {
    const result = await authClient.signIn.email({
      email: email.value,
      password: password.value,
    });

    if (result.error) {
      messageError.value = result.error.message || "Sign in failed";
    } else {
      messageError.value = "";
      await remult.initUser();
      window.location.reload();
    }
  } catch (error) {
    messageError.value = "Sign in failed";
  }
};

const signOut = async () => {
  try {
    await authClient.signOut();
    remult.user = undefined;
    window.location.reload();
  } catch (error) {
    console.error("Sign out failed:", error);
  }
};

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
          Make sure to set the <code>BETTER_AUTH_SECRET</code> in the <code>.env</code> file. <br />
          Read more at <a href="https://better-auth.com" target="_blank">better-auth docs</a>.<br />
          Please check the server terminal console for more information.
        `;
      }
    });
});
</script>
