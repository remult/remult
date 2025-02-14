<script lang="ts">
  interface Props {
    width?: number;
  }

  let { width = 120 }: Props = $props();
</script>

<span class="skeleton" style="--width: {width}px"></span>

<style>
  .skeleton {
    background-color: #eee;
    background-image: linear-gradient(90deg, #eee, #f5f5f5, #eee);
    background-size: 200px 100%;
    background-repeat: no-repeat;
    border-radius: 4px;
    display: inline-block;
    line-height: 1;
    width: var(--width);
    height: 12px;
    animation: skeleton-animation 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-animation {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
</style>
