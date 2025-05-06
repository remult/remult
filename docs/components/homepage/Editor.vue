<script setup lang="ts">
/// <reference lib="es2020" />
declare const Math: {
  floor: (x: number) => number
}
import Code from './Code.vue'
import { onMounted, ref, onUnmounted } from 'vue'
import { stepsData } from './stepsData'
import IconSvelte from '../icons/svelte.vue'
import IconReact from '../icons/react.vue'
import IconVue from '../icons/vue.vue'
import IconAngular from '../icons/angular.vue'
import { useEditor } from './composables/useEditor'

const {
  steps,
  currentStep,
  currentFile,
  codeRef,
  framework,
  keyContext,
  initializeEditor,
  selectStep,
  selectFile,
  getCurrentCode,
  getCurrentLanguage,
} = useEditor(stepsData)

const isAnimating = ref(false)
const visibleSteps = ref<number[]>([])

onMounted(() => {
  initializeEditor()
  // Start animation after 2 seconds
  setTimeout(() => {
    // Show first step
    visibleSteps.value = [0]
    // Show code after 500ms
    setTimeout(() => {
      isAnimating.value = true
      // Sequentially show remaining steps
      for (let i = 1; i < steps.value.length; i++) {
        setTimeout(() => {
          visibleSteps.value = [...visibleSteps.value, i]
        }, i * 700) // 1s delay between each step
      }
    }, 500)
  }, 500)
})

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
              :class="{ active: framework === 'angular' }"
            >
              <input type="radio" v-model="framework" value="angular" />
              <IconAngular />
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
              :class="{ active: framework === 'svelte' }"
            >
              <input type="radio" v-model="framework" value="svelte" />
              <IconSvelte />
            </label>
          </div>
        </div>

        <span class="steps-label">Commit History</span>
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          @click="selectStep(step)"
          class="step-button"
          :class="{
            active: currentStep?.id === step.id,
            'fade-in': visibleSteps.includes(index),
          }"
        >
          <span class="step-name">{{ step.name }}</span>
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

      <div class="editor-content" :class="{ 'fade-in': isAnimating }">
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
          <Code
            ref="codeRef"
            :code="getCurrentCode()"
            :language="getCurrentLanguage()"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.editor {
  background: #050638;
  border-radius: 5px;
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
  background: #1d1f9a;
}

/* Editor Styles */
.editor .shiki.tokyo-night {
  background-color: #050638 !important;
  font-size: 0.8rem;
  line-height: 1.2rem;
}

.editor {
  color: #585ad9;
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
  opacity: 0;
  transition: opacity 0.5s ease;
}

.editor-content.fade-in {
  opacity: 1;
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

.tab-button.active,
.tab-button:hover {
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
  color: #5254c5;
  padding: 0.1rem 0.5rem;
  opacity: 0;
  transition: all 0.15s ease;
}

.step-button.fade-in {
  opacity: 1;
}

.step-button.fade-in .step-name {
  transform: translateX(8px);
  transition: transform 0.5s ease;
}

.step-button.fade-in .step-time {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.step-button.fade-in .step-name,
.step-button.fade-in .step-time {
  opacity: 1;
  transform: translateX(0);
}

.step-button.active,
.step-button:hover {
  color: #cdceff;
}

.step-button.active {
  font-weight: 500;
}

.step-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  transition: transform 0.3s ease;
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
