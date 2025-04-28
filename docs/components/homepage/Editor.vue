<script setup lang="ts">
/// <reference lib="es2020" />
declare const Math: {
  floor: (x: number) => number
}
import Code from './Code.vue'
import { ref, onMounted, watch } from 'vue'
import { type CodeStep, stepsData } from './stepsData'
import { useUserPreference } from '../composables/useUserPreference'
import IconSvelte from '../icons/svelte.vue'
import IconReact from '../icons/react.vue'
import IconVue from '../icons/vue.vue'
import IconAngular from '../icons/angular.vue'

const steps = ref<CodeStep[]>([])
const currentStep = ref<CodeStep | null>(null)
const currentFile = ref<string | null>(null)
const codeRef = ref<InstanceType<typeof Code> | null>(null)

const { framework, keyContext } = useUserPreference()

// Helper function to find appropriate file based on framework and keyContext
const findAppropriateFile = (
  files: CodeStep['files'],
  isMovingForward: boolean = true,
) => {
  const availableFiles = files.filter(
    (f) => f.framework === framework.value || !f.framework,
  )

  // First try to find a file matching the keyContext
  const matchingFile = availableFiles.find(
    (f) => f.keyContext === keyContext.value,
  )

  // If moving forward, prioritize files with changes
  if (isMovingForward) {
    // If we found a matching file and it has changes, return it
    if (matchingFile && matchingFile.changed) {
      return matchingFile
    }

    // Otherwise, find the first file with changes
    const fileWithChanges = availableFiles.find((f) => f.changed)
    if (fileWithChanges) {
      return fileWithChanges
    }
  }

  // If not moving forward, or no files with changes were found,
  // return matching file or the first available file
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

  // For initial load, assume moving forward
  const appropriateFile = findAppropriateFile(initialStep.files, true)
  currentFile.value = appropriateFile?.name || null
  if (appropriateFile) {
    keyContext.value = appropriateFile.keyContext
  }
})

// Watch for framework changes
watch(framework, () => {
  if (!currentStep.value) return

  // When framework changes, maintain current direction (use default true)
  const appropriateFile = findAppropriateFile(currentStep.value.files)
  if (appropriateFile) {
    currentFile.value = appropriateFile.name
    keyContext.value = appropriateFile.keyContext
  }
})

// Modify selectStep to save the selection and track direction
const selectStep = (step: CodeStep) => {
  // Determine if we're moving forward based on the step index
  const currentIndex = steps.value.findIndex(
    (s) => s.id === currentStep.value?.id,
  )
  const newIndex = steps.value.findIndex((s) => s.id === step.id)
  const isMovingForward = newIndex > currentIndex

  currentStep.value = step
  saveCurrentStepIndex(step)

  const appropriateFile = findAppropriateFile(step.files, isMovingForward)
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
  const endIndex = steps.value.length - 1 // Index of the last step
  const totalSeconds = steps.value
    .slice(stepIndex, endIndex) // Include current step up to (but not including) the last step
    .reduce((total, s) => total + (s.stepTime || 0), 0)

  return formatTime(totalSeconds) + ' ago'
}

// Watch for code changes to scroll to changed lines
watch(
  () => getCurrentCode(),
  (newCode, oldCode) => {
    if (newCode !== oldCode) {
      setTimeout(() => {
        codeRef.value?.scrollToChangedLines()
      }, 100)
    }
  }
)
</script>

<template>
  <div class="editor">
    <div class="editor-header">
      <div class="editor-header-left">
        <span></span><span></span><span></span>
      </div>
      Customer Portal
    </div>
    <div class="editor-body">
      <div class="editor-sidebar">
        <div class="editor-framework">
          <div class="framework-icons">
            <label
              class="framework-icon"
              :class="{ active: framework === 'react' }"
            >
              <input type="radio" v-model="framework" value="react" />
              <IconReact />
            </label>
            <label
              class="framework-icon"
              :class="{ active: framework === 'svelte' }"
            >
              <input type="radio" v-model="framework" value="svelte" />
              <IconSvelte />
            </label>
            <label
              class="framework-icon"
              :class="{ active: framework === 'vue' }"
            >
              <input type="radio" v-model="framework" value="vue" />
              <IconVue />
            </label>
            <label
              class="framework-icon"
              :class="{ active: framework === 'angular' }"
            >
              <input type="radio" v-model="framework" value="angular" />
              <IconAngular />
            </label>
          </div>
        </div>

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

        <div class="editor-sidebar-footer">
          <a
            v-for="cta in currentStep?.cta"
            :key="cta.label"
            :href="cta.href"
            :class="{ highlight: cta.highlight }"
          >
            <span v-html="cta.label" />
          </a>
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
          <Code ref="codeRef" :code="getCurrentCode()" :language="getCurrentLanguage()" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.editor {
  background: #050638;
  border-radius: 5px 5px 0 0;
  overflow: hidden;
  font-size: 0.8rem;
  height: 500px;
  width: 900px;
}

.editor-header {
  position: relative;
  pointer-events: none;
  user-select: none;
  display: flex;
  justify-content: center;
  background: #050639;
  border-bottom: 1px solid #080a59;
  color: #484bd2;
  padding: 0.2rem 1rem;
}

.editor-header-left {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  gap: 0.3rem;
  height: 100%;
  align-items: center;
  padding: 0 0.5rem;
}

.editor-header-left span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #080a59;
}

/* Editor Styles */
.editor .shiki.tokyo-night {
  background-color: #050638 !important;
  font-size: 0.8rem;
  line-height: 1.2rem;
}

.editor {
  color: #484bd2;
}

.editor.unchanged .code-block {
  opacity: 0.6;
}

.editor .code-block {
  transition: opacity 0.3s ease;
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
  width: calc(100% - 250px);
}

.editor-tabs {
  display: flex;
  gap: 0.2rem;
  background: #050638;
  border-bottom: 1px solid #080a59;
}

.editor-file-changed {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #025402;
  display: inline-block;
  margin-left: 0.2rem;
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
  padding: 0.2rem 0.5rem;
  height: 30px;
}

.tab-button.active {
  background: #080a59;
}

.editor-sidebar {
  width: 250px;
  background: #050638;
  border-right: 1px solid #080a59;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  color: white;
}

.steps-label {
  color: #3739a2;
  text-transform: uppercase;
  font-size: 0.7rem;
  display: block;
  padding: 0.2rem 0.5rem;
}

.step-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  text-align: left;
  color: #3739a2;
  padding: 0.1rem 0.5rem;
}

.step-button.active {
  color: #c0c2ff;
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
  display: flex;
  flex-direction: column;
  width: 100%;
  border-bottom: 1px solid #080a59;
}

.framework-icons {
  display: flex;
  justify-content: space-between;
}

.framework-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25%;
  height: 30px;
  cursor: pointer;
  color: #484bd2;
  transition: all 0.2s ease;
  position: relative;
  opacity: 0.5;

  svg {
    filter: saturate(0.8);
  }
}

.framework-icon input[type='radio'] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.framework-icon:hover {
  background: #080a59;
  color: #c0c2ff;
}

.framework-icon.active {
  background: #080a59;
  color: #c0c2ff;
  opacity: 1;

  svg {
    filter: saturate(1);
  }
}

.framework-icon svg {
  width: 20px;
  height: 20px;
}

.editor-code {
  padding: 0;
  height: 100%;
  overflow: scroll;
  padding-bottom: 5rem;
}

.editor-sidebar-footer {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem;
  color: white;
  margin-top: auto;
  width: 100%;
  z-index: 1;

  a {
    background: #080a59;
    width: 100%;
    text-align: center;
    padding: 0.25rem 0.5rem;
    border-radius: 5px;
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }

    span span {
      display: block;
      font-size: 0.8rem;
      opacity: 0.5;
    }
  }
}
</style>
