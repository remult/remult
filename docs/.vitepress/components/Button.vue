<template>
  <button 
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-disabled': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'xs' | 'small' | 'medium' | 'large'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'medium',
  disabled: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.btn {
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  cursor: pointer;
  font-weight: 400;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  outline: none;
}

.btn:disabled,
.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.btn-primary {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.btn-primary:hover:not(:disabled),
.btn-primary:focus:not(:disabled) {
  background: var(--vp-c-brand-2);
  border-color: white;
}

.btn-secondary {
  background: transparent;
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-border);
}

.btn-secondary:hover:not(:disabled),
.btn-secondary:focus:not(:disabled) {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-color: white;
}

.btn-danger {
  background: transparent;
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-border);
}

.btn-danger:hover:not(:disabled),
.btn-danger:focus:not(:disabled) {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
  border-color: white;
}

/* Sizes */
.btn-xs {
  padding: 0.1875rem 0.375rem;
  font-size: 0.6875rem;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-medium {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-large {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
</style>