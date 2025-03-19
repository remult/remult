<script setup lang="ts">
import { codeToHtml } from 'shiki'
import { ref, watch } from 'vue'
import { transformerNotationDiff } from '@shikijs/transformers'

// Add one by one when we check them https://shiki.style/languages
export type Language =
  | 'typescript'
  | 'svelte'
  | 'tsx'
  | 'vue'
  | 'angular-ts'
  | 'html'

interface Props {
  code: string
  language?: Language
  theme?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: 'typescript',
  theme: 'tokyo-night',
})

const highlightedCode = ref('')

// Function to update the highlighted code
const updateHighlightedCode = async () => {
  console.time('updateHighlightedCode')
  highlightedCode.value = await codeToHtml(props.code, {
    lang: props.language,
    theme: props.theme,
    transformers: [
      transformerNotationDiff({
        // matchAlgorithm: 'v3',
      }),
    ],
  })
  console.timeEnd('updateHighlightedCode')
}

// Watch for changes in code, language, or theme
watch(
  () => [props.code, props.language, props.theme],
  () => {
    updateHighlightedCode()
  },
  { immediate: true },
)
</script>

<template>
  <div class="code-block">
    <div v-if="highlightedCode" v-html="highlightedCode" />
    <div v-else class="loading-indicator">Loading...</div>
  </div>
</template>

<style scoped>
.code-block {
  padding: 1rem;
}

.code-block :deep(pre) {
  margin: 0;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.loading-indicator {
  color: #666;
  padding: 1rem;
}

.line.diff.add {
  background-color: #003d00;
}

.line.diff.remove {
  background-color: #3d0000;
}
</style>
