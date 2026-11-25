<script lang="ts">
  import { PREFILTER_HINT } from '../core/access.js'
  import AccessMark from './AccessMark.svelte'
</script>

<ul class="legend" aria-label="Legend">
  <li><AccessMark state="yes" /> Allowed</li>
  <li><AccessMark state="no" /> Not allowed</li>
  <li><AccessMark state="row" /> A function decides, row by row</li>
  <li>
    <AccessMark state="yes" icon="filter" hint={PREFILTER_HINT} /> Prefilter: the
    server narrows the rows you get
  </li>
</ul>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
