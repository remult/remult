<script setup lang="ts">
import { onMounted, ref } from "vue"
import { remult } from "remult"
import App from "./App.vue"

const username = ref("")
const signedIn = ref(false)

const signIn = async () => {
  const result = await fetch("/api/signIn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username.value }),
  })
  if (result.ok) {
    remult.user = await result.json()
    signedIn.value = true
    username.value = ""
  } else alert(await result.json())
}
const signOut = async () => {
  await fetch("/api/signOut", {
    method: "POST",
  })
  remult.user = undefined
  signedIn.value = false
}

onMounted(async () => {
  remult.user = await fetch("/api/currentUser").then((r) => r.json())
  signedIn.value = remult.authenticated()
})
</script>
<template>
  <div v-if="!signedIn">
    <h1>todos</h1>
    <main>
      <form @submit.prevent="signIn()">
        <input v-model="username" placeholder="Username, try Steve or Jane" />
        <button>Sign in</button>
      </form>
    </main>
  </div>
  <div v-else>
    <header>
      Hello {{ remult.user!.name }}
      <button @click="signOut()">Sign Out</button>
    </header>
    <App />
  </div>
</template>
