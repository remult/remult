<script setup lang="ts">
interface Props {
  modelValue: any
  options: Array<{ value: any; label: string; disabled?: boolean }>
  placeholder?: string
  class?: string
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  class: '',
})

const emit = defineEmits<Emits>()

const updateValue = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <select
    :value="modelValue"
    @change="updateValue"
    :class="['select-dropdown', props.class]"
  >
    <!-- <option v-if="placeholder" value="" disabled>{{ placeholder }}</option> -->
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
.select-dropdown {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  cursor: pointer;
  height: 36px;
  box-sizing: border-box;
  line-height: 1.2;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M8 11l-5-5h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
  padding-right: 2rem;
  appearance: none;
}

.select-dropdown:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

/* Size variants */
.select-dropdown.small {
  padding: 0.375rem;
  font-size: 0.75rem;
  height: auto;
  padding-right: 1.5rem;
  background-size: 10px;
}

.select-dropdown.compact {
  max-width: 120px;
}

.select-dropdown.medium {
  max-width: 160px;
}
</style>
