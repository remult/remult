<script lang="ts">
  /** One line that, when too long, cuts in the middle: start…end. */
  let { text, tail = 10 }: { text: string; tail?: number } = $props()

  // code points, so an emoji is never split
  const chars = $derived([...text])
  const cut = $derived.by(() => {
    const at = chars.length - Math.min(tail, Math.floor(chars.length / 3))
    // the end starts on a word, not on a space after the ellipsis
    return chars[at] === ' ' ? at + 1 : at
  })
</script>

<!-- split spans read as two words: assistive tech gets the whole text -->
<span class="sr-only">{text}</span><span class="mid" title={text} aria-hidden="true"
  ><span class="head">{chars.slice(0, cut).join('')}</span><span class="tail"
    >{chars.slice(cut).join('')}</span
  ></span
>

<style>
  .mid {
    display: flex;
    min-width: 0;
    max-width: 100%;
    white-space: pre;
  }
  .head {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tail {
    flex-shrink: 0;
  }
</style>
