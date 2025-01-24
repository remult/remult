<script setup lang="ts">
import Code from './Code.vue'
import { ref, onMounted } from 'vue'

interface CodeStep {
  id: string
  name: string
  files: {
    name: string
    content: string
    type?: 'backend' | 'frontend' // default is backend
    framework?: 'svelte' | 'vue' | 'react' | 'angular' // default is nothing
  }[]
}

const steps = ref<CodeStep[]>([])
const currentStep = ref<CodeStep | null>(null)
const currentFile = ref<string | null>(null)

const stepsData: CodeStep[] = [
  {
    id: '0-step1',
    name: 'Define a model',
    files: [
      {
        name: 'entity.ts',
        content: `import { Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.string()
  title: string = ''
}`,
      },
      {
        name: '+page.svelte',
        type: 'frontend',
        framework: 'svelte',
        content: `$effect(() => {
  repo(Task)
    .find(
      { limit: 20 } 
    )
    .then((t) => (tasks = t));
});`,
      },
    ],
  },
]

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

const getFileType = (fileName: string, fileType?: 'backend' | 'frontend') => {
  return fileType || 'backend'
}
</script>

<template>
  <div class="editor rounded-lg overflow-hidden">
    <div class="editor-header bg-[#0d0d2d] text-white p-4">Customer Portal</div>
    <div class="editor-body flex">
      <div class="editor-sidebar bg-[#0a0a24] text-white p-4 w-48">
        <span class="block mb-4">Steps</span>
        <button
          v-for="step in steps"
          :key="step.id"
          @click="selectStep(step)"
          class="block w-full text-left mb-2 px-3 py-2 rounded hover:bg-[#1a1a3a] transition-colors"
          :class="{ 'bg-[#1a1a3a]': currentStep?.id === step.id }"
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

      <div class="editor-content flex-1 bg-[#050638]">
        <div class="editor-tabs flex bg-[#0d0d2d]">
          <button
            v-for="file in currentStep?.files"
            :key="file.name"
            @click="selectFile(file.name)"
            class=""
            :class="{ 'bg-[#1a1a3a]': currentFile === file.name }"
          >
            <span style="padding: 10px">
              {{ file.name }}
              <!-- <span
                class="text-xs px-1.5 py-0.5 rounded"
                :class="{
                  'bg-blue-600':
                    getFileType(file.name, file.type) === 'backend',
                  'bg-green-600':
                    getFileType(file.name, file.type) === 'frontend',
                }"
              >
                {{ getFileType(file.name, file.type) }}
              </span> -->
            </span>
          </button>
        </div>

        <div class="editor-code">
          <Code :code="getCurrentCode()" />
        </div>

        <div
          class="editor-footer flex justify-between p-4 bg-[#0d0d2d] text-white"
        >
          <a href="/docs" class="hover:text-blue-400">More about validation</a>
          <a href="/docs" class="hover:text-blue-400">More about auth</a>
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

  .editor-framework {
    margin-top: auto;
    display: flex;
    flex-direction: column;
  }

  .editor-framework span {
    font-size: .8rem;
    color: #484BD2;
  }

  .editor-framework select {
    background: #050638;
    border: #080A59;
    padding: .5rem;
  }
  
  .editor-code {
    padding: 0;
  }
</style>
