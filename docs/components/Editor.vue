<script setup lang="ts">
import { codeToHtml } from 'shiki'
import { onMounted, ref } from 'vue'

const code = ref(`// Example Customer Model
interface Customer {
  id: string
  name: string
  email: string
  createdAt: Date
}`)

const highlightedCode = ref('')

onMounted(async () => {
  highlightedCode.value = await codeToHtml(code.value, {
    lang: 'typescript',
    theme: 'tokyo-night',
  })
})
</script>

<template>
  <div class="editor">
    <div class="editor-header">Customer Portal</div>
    <div class="editor-body">
      <div class="editor-sidebar">
        <span>Commit History</span>
        <button>define a model</button>
        <button>add validation</button>
        <button>pre-save hook</button>

        <div class="editor-framework">
            <span>Frontend Library</span>
            <select>
                <option value="svelte">Svelte</option>
                <option value="vue">Vue</option>
                <option value="react">React</option>
                <option value="angular">Angular</option>
            </select>
        </div>
      </div>

      <div class="editor-content">
        <div class="editor-tabs">
          <button>Customer.ts</button>
          <button>CustomerList.tsx</button>
        </div>

        <div class="editor-code">
          <div v-if="highlightedCode" v-html="highlightedCode" />
          <div v-else class="loading-indicator">Loading...</div>
        </div>

        <div class="editor-footer">
          <a href="/docs">More about validation</a>
          <a href="/docs">More about auth</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.editor {
  background: #050638;
  border-radius: 3px;
}

.editor-header {
  display: flex;
  justify-content: center;
}

.editor-code {
  padding: 1rem;
}

.editor-code :deep(pre) {
  margin: 0;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

  /* Editor Styles */
  .shiki.tokyo-night {
    background-color: #050638 !important;
    font-size: .8rem;
    line-height: 1.2rem;
  }

  .editor {
    color: #484BD2;
  }

  .editor-body {
    display: flex;
  }

  .editor-tabs {
    display: flex;
    gap: .2rem;
    background: #050638;
    border-bottom: #080A59;
    padding: .5rem;
  }

  .editor-tabs button {
    background: #050638;
    border: #080A59;
    padding: .5rem;
  }

  .editor-sidebar {
    width: 200px;
    background: #050638;
    border-right: #080A59;
    padding: .5rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: .2rem;
  }

  .editor-code {
    padding: 0;
  }

  .editor-framework {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: .2rem;
  }

  .editor-framework select {
    background: #050638;
    border: #080A59;
    padding: .5rem;
  }

  .editor-framework span {
    font-size: .8rem;
    color: #484BD2;
  }

.loading-indicator {
  color: #666;
  padding: 1rem;
}
</style>
