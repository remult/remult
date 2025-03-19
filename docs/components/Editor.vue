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

// Add function to save current step index
const saveCurrentStepIndex = (step: CodeStep) => {
  const index = steps.value.findIndex((s) => s.id === step.id)
  localStorage.setItem('currentStepIndex', index.toString())
}

// Modify onMounted to restore the saved step
onMounted(() => {
  steps.value = stepsData

  // Try to get saved step index from localStorage
  const savedStepIndex = localStorage.getItem('currentStepIndex')
  const initialStep = savedStepIndex
    ? stepsData[parseInt(savedStepIndex)] || stepsData[0]
    : stepsData[0]

  currentStep.value = initialStep

  const appropriateFile = findAppropriateFile(initialStep.files)
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

// Modify selectStep to save the selection
const selectStep = (step: CodeStep) => {
  currentStep.value = step
  saveCurrentStepIndex(step)
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

const getCurrentLanguage = () => {
  if (!currentStep.value || !currentFile.value) return 'typescript'
  const file = currentStep.value.files.find((f) => f.name === currentFile.value)
  return file?.languageCodeHighlight || 'typescript'
}

// Simplified time formatting function
const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}''`
  }
  if (seconds === 0) {
    return `${minutes} min`
  }
  return `${minutes} min ${seconds} sec`
}

// Function to get "ago" time - sum of this step and all LATER steps
const getStepTimeAgo = (stepIndex: number) => {
  // Sum up times for the current step and all steps after it
  // but exclude the last step which is "now"
  const endIndex = steps.value.length - 1; // Index of the last step
  const totalSeconds = steps.value
    .slice(stepIndex, endIndex)  // Include current step up to (but not including) the last step
    .reduce((total, s) => total + (s.stepTime || 0), 0)

  return formatTime(totalSeconds) + ' ago'
}
</script>

<template>
  <div class="editor">
    <div class="editor-header">
      <div class="editor-header-left"><span></span><span></span><span></span></div>
      Customer Portal
    </div>
    <div class="editor-body">
      <div class="editor-sidebar">
        <span class="steps-label">Commit History</span>
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          @click="selectStep(step)"
          class="step-button"
          :class="{ active: currentStep?.id === step.id }"
        >
          <span>{{ step.name }}</span>
          <span class="step-time">{{
            index === steps.length - 1 ? 'now' : getStepTimeAgo(index)
          }}</span>
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
            <span>
              {{ file.name }}
              <span v-if="file.changed" class="editor-file-changed"></span>
            </span>
          </button>
        </div>

        <div class="editor-code">
          <Code :code="getCurrentCode()" :language="getCurrentLanguage()" />
        </div>

        <div class="editor-footer">
          <a v-for="cta in currentStep?.cta" :key="cta.label" :href="cta.href" :class="{ highlight: cta.highlight }">
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
  font-size: .8rem;
  height: calc(100vh - 200px);
  min-height: 500px;
  width: 800px;
}

.editor-header {
  position: relative;
  pointer-events: none;
  user-select: none;
  display: flex;
  justify-content: center;
  background: #050639;
  border-bottom: 1px solid #080A59;
  color: #484BD2;
  padding: .2rem 1rem;
}

.editor-header-left {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  gap: 0.3rem;
  height: 100%;
  align-items: center;
  padding: 0 .5rem;
}

.editor-header-left span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #080A59;
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
  background: #050638;
  height: calc(100% - 30px);
}

.editor-content {
  flex: 1;
  position: relative;
  background: #050638;
}

.editor-tabs {
  display: flex;
  gap: 0.2rem;
  background: #050638;
  border-bottom: 1px solid #080A59;
}

.editor-file-changed {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #025402;
  display: inline-block;
  margin-left: .2rem;
  animation: editor-file-changed-animation 2s infinite;
}

@keyframes editor-file-changed-animation {
  0% {
    background: #025402;
  }
  50% {
    background: #0b9c0b;
  }
  100% {
    background: #025402;
  }
  
}


.tab-button {
  background: #050638;
  border: #080a59;
  padding: .2rem .5rem;
}

.tab-button.active {
  background: #080A59;
}

.editor-sidebar {
  width: 250px;
  background: #050638;
  border-right: 1px solid #080A59;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  color: white;
}

.steps-label {
  color: #3739A2;
  text-transform: uppercase;
  font-size: .7rem;
  display: block;
  padding: .2rem .5rem;
}

.step-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  text-align: left;
  color: #3739A2;
  padding: .1rem .5rem;
}

.step-button.active {
  color: #C0C2FF;
  font-weight: 500;
}


.step-button span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.step-time {
  font-size: 0.65rem;
  color: #484bd2;
  opacity: 0.8;
  min-width: 55px;
  text-align: right;
  flex-shrink: 0;
}

.editor-framework {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  border-top: 1px solid #080A59;
}

.editor-framework span {
  padding: .2rem .5rem;
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
  height: 100%;
  overflow: scroll;
  padding-bottom: 5rem;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #0d0d2d;
  color: white;
  position: absolute;
  bottom: 0;
  gap: 1rem;
}

.editor-footer a:hover {
  color: #60a5fa;
}
</style>
