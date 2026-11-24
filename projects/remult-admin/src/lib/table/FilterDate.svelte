<script lang="ts" module>
  const pad = (n: number) => String(n).padStart(2, '0')
  const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  function presets(): { label: string; value: [string, string] }[] {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const back = (days: number) => ymd(new Date(y, m, now.getDate() - days))
    return [
      { label: 'Last 7 days', value: [back(6), ymd(now)] },
      { label: 'Last 30 days', value: [back(29), ymd(now)] },
      { label: 'This month', value: [ymd(new Date(y, m, 1)), ymd(new Date(y, m + 1, 0))] },
      { label: 'Last month', value: [ymd(new Date(y, m - 1, 1)), ymd(new Date(y, m, 0))] },
    ]
  }
</script>

<script lang="ts">
  import {
    CalendarDay,
    CalendarGrid,
    CalendarHeading,
    CalendarNext,
    CalendarPrevious,
    CalendarWeekday,
    CalendarWeekdays,
    CalendarWeeks,
    DatePicker,
    DatePickerContent,
    DatePickerInput,
    DatePickerPreset,
    DatePickerTrigger,
  } from '@ui-sdk/svelte/date-picker'
  import Icon from '../shell/Icon.svelte'

  let {
    range = false,
    value,
    value2,
    label,
    onchange,
  }: {
    range?: boolean
    value: unknown
    value2?: unknown
    label: string
    onchange: (value: string | undefined, value2?: string) => void
  } = $props()

  let anchor: HTMLElement | undefined = $state()
  const str = (v: unknown) => (typeof v === 'string' && v ? v : null)
  const current = $derived(
    range ? (str(value) && str(value2) ? [str(value)!, str(value2)!] : null) : str(value),
  ) as [string, string] | string | null
</script>

<DatePicker
  mode={range ? 'range' : 'single'}
  value={current}
  onValueChange={(v: [string, string] | string | null) => {
    if (Array.isArray(v)) onchange(v[0], v[1])
    else onchange(v ?? undefined)
  }}
>
  <div class="date-field" bind:this={anchor}>
    <DatePickerInput class="date-input" aria-label={range ? `${label} from` : label} placeholder={range ? 'From' : 'Date'} data-autofocus />
    {#if range}
      <span class="dash" aria-hidden="true">-</span>
      <DatePickerInput end class="date-input" aria-label={`${label} to`} placeholder="To" />
    {/if}
    <DatePickerTrigger class="date-trigger" aria-label="Open calendar">
      <Icon name="calendar" size={14} />
    </DatePickerTrigger>
  </div>
  <DatePickerContent class="calendar-pop" {anchor} align="start" sideOffset={6} collisionPadding={12}>
    <div class="cal-head">
      <CalendarPrevious class="cal-step" aria-label="Previous month">
        <Icon name="chevron-left" size={14} />
      </CalendarPrevious>
      <CalendarHeading class="cal-heading" />
      <CalendarNext class="cal-step" aria-label="Next month">
        <Icon name="chevron-right" size={14} />
      </CalendarNext>
    </div>
    <CalendarGrid class="cal-grid">
      <CalendarWeekdays>
        {#snippet children(index)}
          <CalendarWeekday {index} class="cal-weekday" />
        {/snippet}
      </CalendarWeekdays>
      <CalendarWeeks>
        {#snippet children(cell)}
          <CalendarDay value={cell.date} class="cal-day" />
        {/snippet}
      </CalendarWeeks>
    </CalendarGrid>
    {#if range}
      <div class="presets">
        {#each presets() as p (p.label)}
          <DatePickerPreset value={p.value} class="preset">{p.label}</DatePickerPreset>
        {/each}
      </div>
    {/if}
  </DatePickerContent>
</DatePicker>

<style>
  .date-field {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 2px 0 8px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--bg-raised);
    transition: border-color 120ms var(--ease-out);
  }
  .date-field:hover {
    border-color: color-mix(in oklch, var(--border-strong), var(--text) 15%);
  }
  .date-field:focus-within {
    outline: 2px solid var(--ring);
    outline-offset: -1px;
    border-color: var(--accent);
  }
  .date-field :global(.date-input) {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    outline: none;
  }
  .date-field :global(.date-input::placeholder) {
    color: var(--text-faint);
  }
  .date-field :global(.date-input[data-invalid]) {
    color: var(--danger);
  }
  .dash {
    color: var(--text-faint);
  }
  .date-field :global(.date-trigger) {
    display: grid;
    flex: none;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .date-field :global(.date-trigger:hover),
  .date-field :global(.date-trigger[data-open]) {
    background: var(--bg-hover);
    color: var(--text);
  }

  :global(.calendar-pop) {
    z-index: 50;
    margin: 0;
    border: 0;
    padding: 10px;
    border-radius: var(--radius-lg);
    background: var(--bg-raised);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border),
      var(--shadow-pop);
    transform-origin: var(--transform-origin);
    transition:
      opacity 120ms var(--ease-out),
      scale 120ms var(--ease-out);
  }
  :global(.calendar-pop:is([data-starting-style], [data-ending-style])) {
    opacity: 0;
    scale: 0.97;
  }
  .cal-head {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
  }
  :global(.cal-heading) {
    flex: 1;
    font-weight: 600;
    text-align: center;
  }
  :global(.cal-step) {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  :global(.cal-step:hover) {
    background: var(--bg-hover);
    color: var(--text);
  }
  :global(.cal-step[data-disabled]) {
    opacity: 0.4;
  }
  :global(.cal-grid) {
    border-collapse: collapse;
    user-select: none;
  }
  :global(.cal-weekday) {
    width: 32px;
    height: 24px;
    color: var(--text-faint);
    font-size: var(--text-xs);
    font-weight: 500;
  }
  :global(.cal-day) {
    width: 32px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
    font-size: var(--text-md);
    text-align: center;
    cursor: pointer;
    transition: background-color 80ms var(--ease-out);
  }
  :global(.cal-day:hover) {
    background: var(--bg-hover);
  }
  :global(.cal-day[data-outside]) {
    color: var(--text-faint);
  }
  :global(.cal-day[data-today]) {
    font-weight: 650;
    color: var(--accent);
  }
  :global(.cal-day:is([data-range-middle], [data-preview])) {
    border-radius: 0;
    background: var(--accent-soft);
  }
  :global(.cal-day[data-selected]:not([data-range-middle])),
  :global(.cal-day:is([data-range-start], [data-range-end])) {
    background: var(--accent);
    color: var(--accent-text);
  }
  :global(.cal-day[data-range-start]:not([data-range-end])) {
    border-radius: var(--radius) 0 0 var(--radius);
  }
  :global(.cal-day[data-range-end]:not([data-range-start])) {
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  :global(.cal-day[data-disabled]) {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .presets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }
  :global(.preset) {
    height: 26px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--text-sm);
    text-align: start;
    cursor: pointer;
  }
  :global(.preset:hover) {
    background: var(--bg-hover);
    color: var(--text);
  }
  :global(.preset[data-selected]) {
    background: var(--accent-soft);
    color: var(--text);
    font-weight: 550;
  }
</style>
