<script lang="ts">
  import { onMount } from "svelte";
  import { remult } from "remult";
  import Tile from "../Tile.svelte";
  import type { TileStatus } from "../Tile.svelte";

  let status: TileStatus = "Loading";
  let errorType: "missingSecret" | "other" | null = null;
  let tileSubtitle = "";

  onMount(() => {
    remult
      .initUser()
      .then(() => {
        status = "Success";
      })
      .catch((e) => {
        status = "Error";
        if (e.message.includes("the server configuration")) {
          errorType = "missingSecret";
        } else {
          errorType = "other";
        }
      });
  });

  $: {
    if (status === "Loading") {
      tileSubtitle = "Checking your authentication status";
    } else if (status === "Error") {
      tileSubtitle = "There seems to be an issue";
    }
  }
</script>

<Tile
  title="Auth"
  {status}
  subtitle={tileSubtitle}
  className="auth"
  width="half"
>
  {#if status === "Loading"}
    <!-- You can add a loading indicator here if needed -->
  {:else if status === "Error"}
    {#if errorType === "missingSecret"}
      <p>
        Make sure to set the <code>AUTH_SECRET</code> in the <code>.env</code>
        file. <br />
        Read more at
        <a href="https://errors.authjs.dev#missingsecret">auth.js docs</a>.<br
        />
        Please check the server terminal console for more information.
      </p>
    {:else}
      <p>An error occurred. Please try again later.</p>
    {/if}
  {:else if remult.authenticated()}
    <p>
      You are authenticated as <strong>{remult.user?.name}</strong>
    </p>
    <div class="button-row">
      <a class="button" href="/auth/signout">Sign Out</a>
    </div>
  {:else}
    <p>You are currently not authenticated</p>
    <div class="button-row">
      <a class="button" href="/auth/signin">Sign In</a>
      <a class="button" target="_blank" href="https://authjs.dev"
        >Auth.js Docs</a
      >
    </div>
  {/if}
</Tile>
