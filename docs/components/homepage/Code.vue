<script setup lang="ts">
import 'tslib'
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
const codeBlockRef = ref<HTMLElement | null>(null)

// Function to scroll to changed lines
const scrollToChangedLines = () => {
  if (!codeBlockRef.value) return

  const changedLines = codeBlockRef.value.querySelectorAll('.line.diff.add')
  if (changedLines.length > 0) {
    const firstChangedLine = changedLines[0] as HTMLElement
    const editorContainer = codeBlockRef.value.closest('.editor-code')
    if (editorContainer) {
      const lineTop = firstChangedLine.offsetTop
      const containerHeight = editorContainer.clientHeight
      const containerScrollTop = editorContainer.scrollTop
      const margin = 50 // margin of error in pixels

      // Check if the line is not visible in the viewport with margin
      if (
        lineTop < containerScrollTop + margin ||
        lineTop + firstChangedLine.clientHeight >
          containerScrollTop + containerHeight - margin
      ) {
        const scrollTop =
          lineTop - containerHeight / 2 + firstChangedLine.clientHeight / 2
        editorContainer.scrollTo({
          top: scrollTop,
          behavior: 'smooth',
        })
      }
    }
  }
}

// Function to update the highlighted code
const updateHighlightedCode = async () => {
  // console.time('updateHighlightedCode')
  highlightedCode.value = await codeToHtml(props.code, {
    lang: props.language,
    theme: props.theme,
    transformers: [
      transformerNotationDiff({
        matchAlgorithm: 'v3',
      }),
    ],
  })
  // console.timeEnd('updateHighlightedCode')
}

// Watch for changes in code, language, or theme
watch(
  () => [props.code, props.language, props.theme],
  () => {
    updateHighlightedCode()
  },
  { immediate: true },
)

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
    // Show feedback
    const button = codeBlockRef.value?.querySelector('.copy-button')
    if (button) {
      button.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      setTimeout(() => {
        if (button)
          button.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

// Expose the scroll method
defineExpose({
  scrollToChangedLines,
})
</script>

<template>
  <div class="code-block" ref="codeBlockRef">
    <div v-if="highlightedCode" v-html="highlightedCode" />
    <div v-else class="loading-indicator">Loading...</div>
    <button class="copy-button" @click="copyToClipboard">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path
          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        ></path>
      </svg>
    </button>
  </div>
</template>

<style>
.intro {
  .code-block {
    padding: 0;
    position: relative;
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

  .copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    opacity: 1;
    transition: background-color 0.2s ease;
  }
}
</style>
