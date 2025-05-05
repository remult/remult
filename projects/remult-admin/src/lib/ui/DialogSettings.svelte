<script lang="ts">
  import { godStore } from '../../stores/GodStore.js'
  import { LSContext } from '../stores/LSContext'
  import { SSContext } from '../stores/SSContext'
  import { dialog } from './dialog/dialog.js'

  let localSettings = { ...$LSContext.settings }

  function saveSettings() {
    $LSContext.settings = { ...localSettings }
    dialog.closeAll()
  }
</script>

<div class="dialog">
  <header>Local Storage</header>

  <label>
    <span>With confirm delete</span>
    <select bind:value={localSettings.confirmDelete}>
      <option value={false}>No</option>
      <option value={true}>Yes</option>
    </select>
  </label>

  <label>
    <span>Display fields with</span>
    <select bind:value={localSettings.dispayCaption}>
      <option value={true}>Caption</option>
      <option value={false}>key</option>
    </select>
  </label>

  <label>
    <span>Number of rows</span>
    <input type="number" bind:value={localSettings.numberOfRows} />
  </label>

  <label>
    <span>Disable live query</span>
    <select bind:value={localSettings.disableLiveQuery}>
      <option value={undefined}>Server settings</option>
      <option value={false}>No</option>
      <option value={true}>Yes</option>
    </select>
  </label>

  <label>
    <span>Diagram layout algorithm</span>
    <select
      bind:value={localSettings.diagramLayoutAlgorithm}
      on:change={() => {
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
      bind:value={localSettings.keyForBearerAuth}
      placeholder="Local Storage Key"
    />
  </label>

  <label>
    <span>Custom Headers</span>
    <textarea
      rows={3}
      bind:value={localSettings.customHeaders}
      placeholder={`hello: world`}
      style="resize: vertical; height: 70px;"
    />
  </label>

  <!-- <label>
    <span>api URL</span>
    <input
      type="text"
      bind:value={$LSContext.settings.apiUrl}
      placeholder="api URL, the default it '/api'"
    />
  </label> -->

  <label>
    <span></span>
    <button on:click={saveSettings}> Save </button>
  </label>

  <label>
    <span></span>
    <button
      on:click={() => {
        LSContext.reset()
        localSettings = { ...$LSContext.settings }
      }}
    >
      Reset all settings to default
    </button>
  </label>

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
        disabled={!$SSContext.settings.bearerAuth}
        on:click={() => {
          godStore.reloadEntities()
          dialog.closeAll()
        }}>Use</button
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
  textarea,
  button {
    border: 1px solid var(--border-color);
    border-radius: 0;
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.5rem;
    min-width: auto !important;
    height: var(--cell-height);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input::placeholder {
    color: gray;
    font-style: italic;
  }

  textarea::placeholder {
    color: gray;
    font-style: italic;
  }

  label {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 0.3rem;
    margin-top: 10px;
  }

  label span {
    width: 170px;
    flex-shrink: 0;
  }

  select,
  input,
  textarea {
    flex: 1;
    min-width: 180px;
    font-family: monospace;
  }
</style>
