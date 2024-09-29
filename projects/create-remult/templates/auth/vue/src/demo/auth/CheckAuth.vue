<script setup lang="ts">
import { ref, onMounted } from "vue";
import { type UserInfo, remult } from "remult";

const user = ref<UserInfo | undefined | "loading">("loading");

onMounted(async () => {
  user.value = await remult.initUser();
});
</script>

<template>
  <div v-if="user === 'loading'">Auth: ⌛</div>
  <div v-else-if="remult.authenticated()">
    Auth:✅ Hello {{ remult.user?.name }}
    <a href="/auth/signout">Sign Out</a>
  </div>
  <div v-else>
    Auth:✅ Not authenticated, <a href="/auth/signin">Sign In</a>
  </div>
</template>
