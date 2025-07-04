<script lang="ts" module>
  export type TileStatus = "Success" | "Error" | "Warning" | "Info" | "Loading";
  export type WidthOption = "full" | "half" | "third" | "fourth";
</script>

<script lang="ts">
  interface Props {
    title: string;
    subtitle: string | undefined;
    icon?: string;
    className?: string;
    // Define the allowed values for status and width if using TypeScript
    status?: TileStatus;
    width?: WidthOption;
    children?: import("svelte").Snippet;
  }

  let {
    title,
    subtitle,
    icon = "",
    className = "",
    status = "Loading",
    width = "full",
    children,
  }: Props = $props();

  const children_render = $derived(children);
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
  <div class="tile__content">
    {@render children_render?.()}
  </div>
</div>
