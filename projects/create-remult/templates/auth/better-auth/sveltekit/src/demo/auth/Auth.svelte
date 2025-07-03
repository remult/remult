<script lang="ts">
  import { remult } from "remult";
  import Tile from "../Tile.svelte";

  import { createAuthClient } from "better-auth/svelte";

  const authClient = createAuthClient({
    // you can pass client configuration here
  });

  let name = $state("");
  let email = $state("");
  let password = $state("");

  let messageError = $state("");
</script>

<Tile title="Auth" status="Success" subtitle="" className="auth" width="half">
  {#if remult.authenticated()}
    {@const roles = remult.user?.roles ?? []}
    <p>
      You are authenticated as <strong>{remult.user?.name}</strong>
      <br />
      <i>Roles:</i>
      {roles.length > 0 ? roles.join(", ") : "-"}
    </p>
    <div class="button-row">
      <button
        onclick={async () => {
          await authClient.signOut();
          remult.user = undefined;
        }}
      >
        Sign Out</button
      >
    </div>
  {:else}
    <p>You are currently not authenticated</p>
    {#if messageError}
      <div class="message error">
        <p>{messageError}</p>
      </div>
      <br />
    {/if}
    <input type="text" bind:value={name} placeholder="Name" />
    <br />
    <br />
    <input type="email" bind:value={email} placeholder="Email" />
    <br />
    <br />
    <input type="password" bind:value={password} placeholder="Password" />
    <div class="button-row">
      <button
        class="button"
        onclick={async () => {
          const res = await authClient.signUp.email({
            name,
            email,
            password,
          });
          messageError = res.error?.message ?? "";
          remult.initUser();
        }}
      >
        Sign Up
      </button>
      <button
        class="button"
        onclick={async () => {
          await authClient.signIn.email({ email, password });
          remult.initUser();
        }}
      >
        Sign In
      </button>
    </div>
    <div class="button-row">
      <a class="button" target="_blank" href="https://better-auth.com"
        >Better-Auth Docs</a
      >
    </div>
  {/if}
</Tile>
