<script setup lang="ts">
import { codeToHtml } from 'shiki'
import { onMounted, ref, watch } from 'vue'

interface Props {
  code: string
  language?: string
  theme?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: 'typescript',
  theme: 'tokyo-night',
})

const highlightedCode = ref('')

// Function to update the highlighted code
const updateHighlightedCode = async () => {
  highlightedCode.value = await codeToHtml(props.code, {
    lang: props.language,
    theme: props.theme,
  })
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
</style>
