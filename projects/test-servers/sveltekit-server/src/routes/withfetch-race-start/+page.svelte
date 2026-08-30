<h2>withFetch demo map</h2>

<h3>why withFetch exists (F5 these directly)</h3>
<ul>
  <li><a id="go-leak" href="/ssr-leak">ssr-leak - plain repo(): F5 flashes private data ❌</a></li>
  <li><a id="go-fixed" href="/ssr-fixed">ssr-fixed - withFetch(event.fetch): consistent ✅</a></li>
</ul>

<h3>the browser trap (navigate from here, then "run the test")</h3>
<ul>
  <li><a id="go" href="/withfetch-race">withfetch-race (parallel loads - the trap)</a></li>
  <li><a id="go-ok" href="/withfetch-ok">withfetch-ok (sequential loads - control)</a></li>
</ul>

<h3>directions</h3>
<ul>
  <li><a id="go-best" href="/withfetch-best">withfetch-best (userland explicit repo - works on stock)</a></li>
</ul>
