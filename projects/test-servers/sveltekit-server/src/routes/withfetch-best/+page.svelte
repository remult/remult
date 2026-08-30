<script lang="ts">
  import { invalidate } from '$app/navigation'
  import type { PageData } from './$types'
  export let data: PageData

  let verdict = ''
  const pause = () => new Promise((r) => setTimeout(r, 50))

  const check = async (url: string, expected: 'LAYOUT' | 'PAGE') => {
    const before = { layout: data.layoutRanAt, page: data.pageRanAt }
    await invalidate(url)
    await pause()
    const layoutReran = data.layoutRanAt !== before.layout
    const pageReran = data.pageRanAt !== before.page
    const expectedReran = expected === 'LAYOUT' ? layoutReran : pageReran
    const otherReran = expected === 'LAYOUT' ? pageReran : layoutReran
    if (expectedReran) return `✅ ${url} reran ${expected} - correct`
    if (otherReran)
      return `❌ CONTAMINATION: ${url} reran the OTHER load - its query went through the wrong event.fetch`
    return `⚠️ INERT: ${url} reran nothing - no dependency was registered (safe but invalidate is dead)`
  }

  const runTest = async () => {
    verdict = 'testing...'
    const r1 = await check('/api/tasks', 'LAYOUT')
    const r2 = await check('/api/products', 'PAGE')
    verdict = r1 + '\n' + r2
  }
</script>

<h2>withFetch demo</h2>
<p>LAYOUT loads tasks ({data.taskCount}) | PAGE loads products ({data.productCount})</p>

<button id="run-test" on:click={runTest}>run the test</button>

<pre id="verdict">{verdict}</pre>
