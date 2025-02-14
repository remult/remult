<script lang="ts">
  import { dialog } from './dialog'
  import DialogPrimitive from './DialogPrimitive.svelte'
</script>

{#each $dialog as toShow}
  {#if toShow.type === 'confirm' || toShow.type === 'confirmDelete'}
    <DialogPrimitive config={toShow.config}>
      {@html toShow.children}
    </DialogPrimitive>
  {:else if toShow.component}
    <DialogPrimitive config={toShow.config}>
      <toShow.component {...toShow.props}
      ></toShow.component>
    </DialogPrimitive>
  {:else}
    <DialogPrimitive
      config={{
        title: toShow.config.title ?? 'FOR DEV',
        description:
          toShow.config.description ??
          'Hey 🫵 developer, you are missing a few things 🤡!',
        buttonSuccess: toShow.config.buttonSuccess ?? "Ok, got it, I'll try!",
      }}
    >
      <div class="">
        <p>Option 1, use built in dialog like this:</p>

        <pre class="">{`await dialog.confirmDelete('The Car')`}</pre>

        <br />
        <p>Option 2, give your own component</p>
        <pre class="">{`await dialog.show({
  config: { title: 'Interlocuteur' },
  component: CreateCarForm,
  props: { isEdit: false },
})`}</pre>

        <p>Good luck 🚀</p>
      </div>
    </DialogPrimitive>
  {/if}
{/each}
