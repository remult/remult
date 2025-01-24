<script setup lang="ts">
import Code from './Code.vue'
import { ref, onMounted } from 'vue'
import { type CodeStep, stepsData } from './stepsData'

const steps = ref<CodeStep[]>([])
const currentStep = ref<CodeStep | null>(null)
const currentFile = ref<string | null>(null)

onMounted(() => {
  steps.value = stepsData
  currentStep.value = stepsData[0]
  currentFile.value = stepsData[0].files[0].name
})

const selectStep = (step: CodeStep) => {
  currentStep.value = step
  currentFile.value = step.files[0].name
}

const selectFile = (fileName: string) => {
  currentFile.value = fileName
}

const getCurrentCode = () => {
  if (!currentStep.value || !currentFile.value) return ''
  const file = currentStep.value.files.find((f) => f.name === currentFile.value)
  const tt = file?.content || ''
  return tt
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
          <button
            v-for="file in currentStep?.files"
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
