<script lang="ts">
  import { dialog } from './dialog/dialog.js'

  export let text: string
  let currentValue = text

  function handleSave() {
    dialog.close({ success: true, data: currentValue })
  }
</script>

<div class="text-editor">
  <textarea bind:value={currentValue} rows="10"></textarea>
  <div class="actions">
    <button class="primary" on:click={handleSave}> Save </button>
  </div>
</div>

<style>
  .text-editor {
    width: 100%;
    height: 100%;
  }

  textarea {
    width: 100%;
    height: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0;
    resize: vertical;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  button {
    border: 1px solid var(--border-color);
    border-radius: 0;
    padding: 0.2rem 0.5rem;
    height: var(--cell-height);
  }
</style>
