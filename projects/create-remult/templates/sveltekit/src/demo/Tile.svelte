<script lang="ts" context="module">
  export type TileStatus = "Success" | "Error" | "Warning" | "Info" | "Loading";
  export type WidthOption = "full" | "half" | "third" | "fourth";
</script>

<script lang="ts">
  export let title: string;
  export let subtitle: string | undefined;
  export let icon = "";
  export let className = "";

  // Define the allowed values for status and width if using TypeScript

  export let status: TileStatus = "Loading";
  export let width: WidthOption = "full";
</script>

<div class={`tile ${status?.toLowerCase()} ${width} ${className}`}>
  <div class="tile__header">
    <h3 class="tile__title">{title}</h3>
    <div class="tile__subtitle">{subtitle}</div>
    {#if icon}
      <img src="{icon}.svg" alt="{icon} icon" class="tile__icon" />
    {:else if status}
      <div class="tile__status-indicator"></div>
    {/if}
  </div>
  <slot></slot>
</div>
