<template>
  <div :class="['tile', status?.toLowerCase(), width, className]">
    <div class="tile__header">
      <h3 class="tile__title">{{ title }}</h3>
      <div class="tile__subtitle">{{ subtitle }}</div>
      <img
        v-if="icon"
        :src="icon + '.svg'"
        :alt="`${icon} icon`"
        class="tile__icon"
      />
      <div v-else-if="status" class="tile__status-indicator"></div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

type TileStatus = "Success" | "Error" | "Warning" | "Info" | "Loading";

interface TileProps {
  title: string;
  subtitle: string;
  status?: TileStatus;
  width?: "full" | "half" | "third" | "fourth";
  icon?: string;
  className?: string;
}

defineProps<TileProps>();
</script>
