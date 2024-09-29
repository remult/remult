<script lang="ts">
  import { onMount } from "svelte";
  import { remult, type UserInfo } from "remult";

  let user: UserInfo | undefined | "loading" = "loading";

  onMount(async () => {
    user = await remult.initUser();
  });
</script>

{#if user === "loading"}
  <div>Auth: ⌛</div>
{:else if remult.authenticated()}
  <div>
    Auth:✅ Hello {remult.user?.name}
    <a href="/auth/signout">Sign Out</a>
  </div>
{:else}
  <div>
    Auth:✅ Not authenticated, <a href="/auth/signin">Sign In</a>
  </div>
{/if}
