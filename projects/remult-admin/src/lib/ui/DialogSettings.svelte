<script lang="ts">
  import { godStore } from '../../stores/GodStore.js'
  import { LSContext } from '../stores/LSContext'
  import { SSContext } from '../stores/SSContext'
</script>

<div class="dialog">
  <header>Local Storage</header>

  <label>
    <span>With confirm delete</span>
    <select bind:value={$LSContext.settings.confirmDelete}>
      <option value={false}>No</option>
      <option value={true}>Yes</option>
    </select>
  </label>

  <label>
    <span>Display fields with</span>
    <select bind:value={$LSContext.settings.dispayCaption}>
      <option value={true}>Caption</option>
      <option value={false}>key</option>
    </select>
  </label>

  <label>
    <span>Diagram layout algorithm</span>
    <select
      bind:value={$LSContext.settings.diagramLayoutAlgorithm}
      onchange={() => {
        $LSContext.schema = {}
        window.location.reload()
      }}
    >
      <option value={'grid-dfs'}>grid-dfs</option>
      <option value={'grid-bfs'}>grid-bfs</option>
      <option value={'line'}>line</option>
    </select>
  </label>

  <label>
    <span>Local Storage Key for Auth</span>
    <input
      type="text"
      bind:value={$LSContext.settings.keyForBearerAuth}
      placeholder="Local Storage Key"
    />
  </label>

  <label>
    <span>api URL</span>
    <input
      type="text"
      bind:value={$LSContext.settings.apiUrl}
      placeholder="api URL, the default it '/api'"
    />
  </label>

  <br />

  <label>
    <span></span>
    <button
      onclick={() => {
        LSContext.reset()
      }}
    >
      Reset all settings to default
    </button>
  </label>

  <br />
  <br />
  <hr style="border-top: 1px solid black;" />
  <br />

  <header>Session Storage</header>

  <label>
    <span>Auth</span>
    <div>
      <input
        type="text"
        bind:value={$SSContext.settings.bearerAuth}
        placeholder="bearer"
      />
      <button
        onclick={() => {
          godStore.reloadEntities()
        }}>Reload entities</button
      >
    </div>
  </label>
</div>

<style>
  header {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  input,
  select,
  button {
    border: 1px solid var(--border-color);
    border-radius: 0;
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.5rem;
    min-width: auto !important;
    height: var(--cell-height);
  }

  input::placeholder {
    color: gray;
    font-style: italic;
  }

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: 10px;
  }

  select {
    width: 180px;
  }
</style>
