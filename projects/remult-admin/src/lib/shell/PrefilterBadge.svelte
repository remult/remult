<script lang="ts">
  import { PREFILTER_HINT } from '../core/access.js'
  import Icon from './Icon.svelte'
</script>

<span class="prefilter" title={PREFILTER_HINT}>
  <Icon name="filter" size={11} stroke={2} />
  Prefiltered
</span>

<style>
  .prefilter {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 7px 0 6px;
    border-radius: 9px;
    background: var(--bg-inset);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-muted);
    font-size: var(--text-xs);
    font-weight: 500;
    line-height: 18px;
    white-space: nowrap;
    vertical-align: 1px;
    cursor: help;
  }
</style>
