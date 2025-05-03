<script setup lang="ts">
/// <reference lib="es2020" />
declare const Math: {
  floor: (x: number) => number
}
import Code from './Code.vue'
import { ref, onMounted, computed } from 'vue'
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

const sidebarOpen = ref(false)

onMounted(() => {
  initializeEditor()
})

// Computed property for visible files
const visibleFiles = computed(() => {
  if (!currentStep.value) return []
  return currentStep.value.files.filter(
    (f) => f.framework === undefined || f.framework === framework.value,
  )
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="editor-mobile">
    <!-- Framework selector - always visible -->
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
        <label class="framework-icon" :class="{ active: framework === 'vue' }">
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

    <div class="editor-body">
      <!-- Commit history as a select -->
      <div class="commit-selector">
        <button
          class="nav-button left"
          @click="
            () => {
              const currentIndex = steps.findIndex(
                (s) => s.id === currentStep?.id,
              )
              if (currentIndex > 0) selectStep(steps[currentIndex - 1])
            }
          "
          :disabled="steps.findIndex((s) => s.id === currentStep?.id) === 0"
        >
          ←
        </button>
        <select
          :value="currentStep?.id"
          @change="
            (e) => {
              const selectedStep = steps.find(
                (s) => s.id === (e.target as HTMLSelectElement).value,
              )
              if (selectedStep) selectStep(selectedStep)
            }
          "
        >
          <option v-for="step in steps" :key="step.id" :value="step.id">
            {{ step.name }}
          </option>
        </select>
        <button
          class="nav-button right"
          @click="
            () => {
              const currentIndex = steps.findIndex(
                (s) => s.id === currentStep?.id,
              )
              if (currentIndex < steps.length - 1)
                selectStep(steps[currentIndex + 1])
            }
          "
          :disabled="
            steps.findIndex((s) => s.id === currentStep?.id) ===
            steps.length - 1
          "
        >
          →
        </button>
      </div>

      <!-- Main content -->
      <div class="editor-content">
        <!-- Horizontal file tabs scrollbar -->
        <div class="editor-tabs">
          <button
            v-for="file in visibleFiles"
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

    <div class="editor-footer">
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
</template>

<style>
.editor-mobile {
  background: #050638;
  border-radius: 10px;
  overflow: hidden;
  font-size: 0.8rem;
  height: calc(100vh - 100px);
  max-height: 600px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
}

.editor-mobile .copy-button {
  display: none;
}

/* Framework selector styles */
.editor-mobile .editor-framework {
  background: #050639;
  border-bottom: 1px solid #080a59;
  padding: 0.5rem;
}

.editor-mobile .framework-icons {
  display: flex;
  justify-content: space-between;
  gap: 5px;
}

.editor-mobile .framework-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 0.5rem 0;
  cursor: pointer;
  color: #484bd2;
  transition: all 0.2s ease;
  position: relative;
  opacity: 0.5;
  border-radius: 4px;
}

.editor-mobile .framework-icon input[type='radio'] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.editor-mobile .framework-icon:hover {
  background: #080a59;
  color: #c0c2ff;
}

.editor-mobile .framework-icon.active {
  background: #080a59;
  color: #c0c2ff;
  opacity: 1;
}

.editor-mobile .framework-icon svg {
  width: 18px;
  height: 18px;
}

/* Commit selector styles */
.editor-mobile .commit-selector {
  padding: 0.5rem;
  background: #050639;
  border-bottom: 1px solid #080a59;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.editor-mobile .commit-selector select {
  flex: 1;
  background: #080a59;
  color: #c0c2ff;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  height: 38px;
  cursor: pointer;
  text-align: center;
}

.editor-mobile .commit-selector select option {
  font-size: 1rem;
  background: #080a59;
  color: #c0c2ff;
}

.editor-mobile .nav-button {
  background: #080a59;
  color: #c0c2ff;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-mobile .nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-mobile .nav-button:not(:disabled):hover {
  background: #2a2ead;
}

/* Editor Styles */
.editor-mobile .shiki.tokyo-night {
  background-color: #050638 !important;
  font-size: 0.75rem;
  line-height: 1.2rem;

  code {
    padding: 0;
  }
}

.editor-mobile {
  color: #c0c2ff;
}

.editor-mobile .editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #050638;
  overflow: hidden;
}

.editor-mobile .editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #050638;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
	opacity: 1;
}

.editor-mobile .editor-tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: #050638;
  border-bottom: 1px solid #080a59;
  padding: 0 0.3rem;
}

.editor-mobile .editor-tabs::-webkit-scrollbar {
  display: none;
}

.editor-mobile .editor-file-changed {
  width: 6px;
  height: 6px;
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

.editor-mobile .tab-button {
  background: #050638;
  border: none;
  color: #484bd2;
  padding: 0.3rem 0.6rem;
  height: 32px;
  white-space: nowrap;
  font-size: 0.75rem;
}

.editor-mobile .tab-button.active {
  background: #080a59;
  color: #c0c2ff;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.editor-mobile .editor-code {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 3rem;
  font-size: 0.85rem;
  line-height: 1.4;
}

.editor-mobile .editor-footer {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background: #050639;
  border-top: 1px solid #080a59;
}

.editor-mobile .editor-footer a {
  background: #080a59;
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  border-radius: 5px;
  margin-bottom: 0.5rem;
  color: #c0c2ff;
  text-decoration: none;
  font-size: 0.8rem;
}

.editor-mobile .editor-footer a:last-child {
  margin-bottom: 0;
}

.editor-mobile .editor-footer a.highlight {
  background: #2a2ead;
}

.editor-mobile .editor-footer a span span {
  display: block;
  font-size: 0.7rem;
  opacity: 0.7;
}
</style>
