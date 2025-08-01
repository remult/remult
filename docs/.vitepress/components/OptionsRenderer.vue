<script setup lang="ts">
interface OptionDefinition {
  key: string
  type: 'boolean' | 'string' | 'number'
  label: string
  description?: string
}

interface Props {
  options: OptionDefinition[]
  values: Record<string, any>
  idPrefix: string
}

interface Emits {
  (e: 'update', key: string, value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const updateOption = (key: string, value: any) => {
  emit('update', key, value)
}
</script>

<template>
  <div class="field-options">
    <div
      v-for="option in options"
      :key="option.key"
      class="option-group"
    >
      <label :for="`${idPrefix}-${option.key}`" class="option-label">
        {{ option.label }}
      </label>
      <!-- Boolean options -->
      <input
        v-if="option.type === 'boolean'"
        :id="`${idPrefix}-${option.key}`"
        type="checkbox"
        :checked="values[option.key] === true"
        @change="
          updateOption(
            option.key,
            ($event.target as HTMLInputElement).checked,
          )
        "
        class="option-checkbox"
      />
      <!-- Number options -->
      <input
        v-else-if="option.type === 'number'"
        :id="`${idPrefix}-${option.key}`"
        type="number"
        :value="values[option.key] || ''"
        @input="
          updateOption(
            option.key,
            ($event.target as HTMLInputElement).value
              ? Number(($event.target as HTMLInputElement).value)
              : undefined,
          )
        "
        class="option-input"
        :placeholder="option.description"
      />
      <!-- String options -->
      <input
        v-else
        :id="`${idPrefix}-${option.key}`"
        type="text"
        :value="values[option.key] || ''"
        @input="
          updateOption(
            option.key,
            ($event.target as HTMLInputElement).value || undefined,
          )
        "
        class="option-input"
        :placeholder="option.description"
      />
    </div>
  </div>
</template>

<style scoped>
.field-options {
  border-top: 1px solid var(--vp-c-border);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  display: grid;
  gap: 0.5rem;
}

.option-group {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.5rem;
  align-items: center;
}

.option-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-align: left;
  margin: 0;
}

.option-input {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.75rem;
  transition: border-color 0.2s;
  height: auto;
  min-height: 26px;
  box-sizing: border-box;
}

.option-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.option-input::placeholder {
  color: var(--vp-c-text-3);
  opacity: 0.6;
}

.option-checkbox {
  justify-self: start;
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  position: relative;
  margin: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.option-checkbox:checked {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.option-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 1px;
  left: 3px;
  color: white;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
}

.option-checkbox:hover {
  border-color: var(--vp-c-brand-1);
}
</style>