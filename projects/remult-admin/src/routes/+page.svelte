<script lang="ts">
  import { god } from '#lib/core/god.svelte.js'
</script>

<h1>Remult Admin</h1>
<ul>
  {#each god.visibleTables as t (t.superKey)}
    <li>{t.caption}</li>
  {/each}
</ul>
