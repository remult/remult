<script setup lang="ts">
import Code from './Code.vue'
import { ref, onMounted, watch } from 'vue'
import { type CodeStep, stepsData } from './stepsData'
import { useUserPreference } from './composables/useUserPreference'

const steps = ref<CodeStep[]>([])
const currentStep = ref<CodeStep | null>(null)
const currentFile = ref<string | null>(null)

const { framework, keyContext } = useUserPreference()

// Helper function to find appropriate file based on framework and keyContext
const findAppropriateFile = (files: CodeStep['files']) => {
  const availableFiles = files.filter(
    (f) => f.framework === framework.value || !f.framework,
  )
  const matchingFile = availableFiles.find(
    (f) => f.keyContext === keyContext.value,
  )
  return matchingFile || availableFiles[0]
}

onMounted(() => {
  steps.value = stepsData
  currentStep.value = stepsData[0]

  const appropriateFile = findAppropriateFile(stepsData[0].files)
  currentFile.value = appropriateFile?.name || null
  if (appropriateFile) {
    keyContext.value = appropriateFile.keyContext
  }
})

// Watch for framework changes
watch(framework, () => {
  if (!currentStep.value) return

  const appropriateFile = findAppropriateFile(currentStep.value.files)
  if (appropriateFile) {
    currentFile.value = appropriateFile.name
    keyContext.value = appropriateFile.keyContext
  }
})

const selectStep = (step: CodeStep) => {
  currentStep.value = step
  const appropriateFile = findAppropriateFile(step.files)
  if (appropriateFile) {
    currentFile.value = appropriateFile.name
    keyContext.value = appropriateFile.keyContext
  }
}

const selectFile = (fileName: string) => {
  currentFile.value = fileName
  if (currentStep.value) {
    const file = currentStep.value.files.find((f) => f.name === fileName)
    if (file?.keyContext) {
      keyContext.value = file.keyContext
    }
  }
}

const getCurrentCode = () => {
  if (!currentStep.value || !currentFile.value) return ''
  const file = currentStep.value.files.find((f) => f.name === currentFile.value)
  return file?.content || ''
}
</script>

<template>
  <div class="editor">
    <div class="editor-header">Customer Portal</div>
    <div class="editor-body">
      <div class="editor-sidebar">
        <span class="steps-label">Steps</span>
        <button
          v-for="step in steps"
          :key="step.id"
          @click="selectStep(step)"
          class="step-button"
          :class="{ active: currentStep?.id === step.id }"
        >
          {{ step.name }}
        </button>

        <div class="editor-framework">
          <span>Frontend Library</span>
          <select v-model="framework">
            <option value="react">React</option>
            <option value="svelte">Svelte</option>
            <option value="vue">Vue</option>
            <option value="angular">Angular</option>
          </select>
        </div>
      </div>

      <div class="editor-content">
        <div class="editor-tabs">
          <button
            v-for="file in currentStep?.files.filter(
              (f) => f.framework === undefined || f.framework === framework,
            )"
            :key="file.name"
            @click="selectFile(file.name)"
            class="tab-button"
            :class="{ active: currentFile === file.name }"
          >
            <span>{{ file.name }}</span>
          </button>
        </div>

        <div class="editor-code">
          <Code :code="getCurrentCode()" />
        </div>

        <div class="editor-footer">
          <a v-for="cta in currentStep?.cta" :key="cta.label" :href="cta.href">
            {{ cta.label }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.editor {
  background: #050638;
  border-radius: 3px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: center;
  background: #0d0d2d;
  color: white;
  padding: 1rem;
}

/* Editor Styles */
.shiki.tokyo-night {
  background-color: #050638 !important;
  font-size: 0.8rem;
  line-height: 1.2rem;
}

.editor {
  color: #484bd2;
}

.editor-body {
  display: flex;
}

.editor-content {
  flex: 1;
  background: #050638;
}

.editor-tabs {
  display: flex;
  gap: 0.2rem;
  background: #050638;
  border-bottom: #080a59;
  padding: 0.5rem;
}

.tab-button {
  background: #050638;
  border: #080a59;
  padding: 0.5rem;
}

.tab-button.active {
  background: #1a1a3a;
}

.editor-sidebar {
  width: 200px;
  background: #050638;
  border-right: #080a59;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0.2rem;
  color: white;
}

.steps-label {
  display: block;
  margin-bottom: 1rem;
}

.step-button {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.step-button:hover {
  background: #1a1a3a;
}

.step-button.active {
  background: #1a1a3a;
}

.editor-framework {
  margin-top: auto;
  display: flex;
  flex-direction: column;
}

.editor-framework span {
  font-size: 0.8rem;
  color: #484bd2;
}

.editor-framework select {
  background: #050638;
  border: #080a59;
  padding: 0.5rem;
}

.editor-code {
  padding: 0;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #0d0d2d;
  color: white;
}

.editor-footer a:hover {
  color: #60a5fa;
}
</style>
