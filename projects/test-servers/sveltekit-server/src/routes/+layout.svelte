<script lang="ts">
  import { page } from '$app/stores'
</script>

<nav>
  <a href="/">home</a>
  <a href="/withfetch-race-start">demo map</a>
  <a href="/ssr-leak">ssr-leak ❌</a>
  <a href="/ssr-fixed">ssr-fixed ✅</a>
  <a href="/withfetch-race">race (trap)</a>
  <a href="/withfetch-ok">ok (control)</a>
  <a href="/withfetch-best">best (explicit)</a>
</nav>

<p class="path">
  📁 <code>projects/test-servers/sveltekit-server/src/routes{$page.route.id === '/' ? '' : $page.route.id}/</code>
</p>

<slot />

<style>
  nav {
    display: flex;
    gap: 14px;
    padding: 10px 14px;
    border-bottom: 1px solid #444;
    flex-wrap: wrap;
  }
  nav a {
    text-decoration: none;
  }
  .path {
    margin: 6px 14px;
    font-size: 13px;
    opacity: 0.7;
  }
</style>
