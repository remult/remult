<script lang="ts">
  import type { PageData } from './$types'
  export let data: PageData
  $: leaked = data.rows.length > 1 || data.rows.some((r) => r.secret)
</script>

<h2>ssr-fixed: withFetch(event.fetch) in a universal load</h2>
<p>I am NOT logged in - I should only see public rows, and never a secret.</p>
<pre id="rows">{JSON.stringify(data.rows, null, 2)}</pre>
<h1 id="verdict">{leaked ? '❌ I can see private data!' : '✅ only public data'}</h1>
<p>F5 this page: ✅ on SSR and in the browser - no flicker, api rules always apply</p>
