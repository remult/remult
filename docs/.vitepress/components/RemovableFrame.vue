<script setup lang="ts">
interface Props {
  canRemove?: boolean
  removeTitle?: string
}

interface Emits {
  (e: 'remove'): void
}

const props = withDefaults(defineProps<Props>(), {
  canRemove: true,
  removeTitle: 'Remove'
})

const emit = defineEmits<Emits>()

const handleRemove = () => {
  emit('remove')
}
</script>

<template>
  <div class="removable-frame">
    <slot />
    
    <!-- Cross button for removal positioned at top right of frame -->
    <button
      v-if="canRemove"
      @click="handleRemove"
      class="remove-cross"
      :title="removeTitle"
      tabindex="-1"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.removable-frame {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  padding: 0.75rem;
  transition: border-color 0.2s;
  position: relative;
}

.removable-frame:hover {
  border-color: var(--vp-c-border-hover);
}

.remove-cross {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 14px;
  height: 14px;
  background: var(--vp-c-danger-1);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0.4;
  z-index: 10;
}

.remove-cross:hover {
  opacity: 1;
  background: var(--vp-c-danger-2);
  transform: scale(1.1);
}

.remove-cross:focus {
  outline: none;
}
</style>