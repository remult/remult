import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// records the ~30s showcase video: SHOWCASE=1 npx playwright test showcase
test.skip(!process.env.SHOWCASE, 'set SHOWCASE=1 to record the showcase')

const SIZE = { width: 1920, height: 1080 }
test.use({
  viewport: SIZE,
  deviceScaleFactor: 1,
  colorScheme: 'light',
  video: { mode: 'on', size: SIZE },
})

const REGEX_BETWEEN = /createdAt\.gte=/
const REGEX_CHIP = /^Filter: /

// the inline edit saves: put the file back as it was
const DB_FILES = ['deals.json'].map((f) => join(process.cwd(), 'db', f))
const saved = new Map<string, string>()
test.beforeAll(() => {
  for (const f of DB_FILES) saved.set(f, readFileSync(f, 'utf8'))
})
test.afterAll(() => {
  for (const [f, content] of saved) writeFileSync(f, content)
})

// a fake cursor and a caption, raised above any top layer popover or dialog
function overlay() {
  const mount = () => {
    const style = document.createElement('style')
    style.textContent = `
      /* 125% to read at video size; zoom scales viewport units too, undo it on full height boxes */
      body { zoom: 1.25; }
      .app { height: 80dvh !important; }
      .row-drawer { height: calc(80dvh - 16px) !important; }
      .settings { max-height: calc(80dvh - 48px) !important; }
      #sc-cursor, #sc-caption { position: fixed; inset: auto; margin: 0; padding: 0; border: 0; overflow: visible; pointer-events: none; background: none; }
      #sc-cursor { top: 0; left: 0; width: 26px; height: 26px; translate: -100px -100px; }
      #sc-cursor::before { content: ''; position: absolute; inset: 0; border-radius: 50%; translate: -50% -50%;
        background: oklch(0.52 0.16 262 / 0.22); border: 2px solid oklch(0.52 0.16 262 / 0.8); transition: scale 120ms; }
      #sc-cursor[data-down]::before { scale: 0.7; background: oklch(0.52 0.16 262 / 0.45); }
      #sc-caption { left: 50%; top: 10px; translate: -50% -8px; opacity: 0; display: flex; align-items: center; gap: 14px;
        padding: 12px 24px; border-radius: 999px; font: 500 24px/1.2 var(--font, system-ui); letter-spacing: -0.01em;
        color: oklch(0.99 0 0); background: oklch(0.24 0.012 260 / 0.92); box-shadow: 0 10px 30px oklch(0 0 0 / 0.25);
        transition: opacity 220ms cubic-bezier(0.2, 0, 0, 1), translate 220ms cubic-bezier(0.2, 0, 0, 1); white-space: nowrap; }
      #sc-caption[data-on] { opacity: 1; translate: -50% 0; }
      #sc-caption b { font-weight: 650; color: oklch(0.8 0.11 262); }
    `
    const cursor = document.createElement('div')
    cursor.id = 'sc-cursor'
    const caption = document.createElement('div')
    caption.id = 'sc-caption'
    for (const el of [cursor, caption]) el.setAttribute('popover', 'manual')
    document.head.append(style)
    // outside the zoomed body: mouse coordinates map 1:1
    document.documentElement.append(caption, cursor)
    const raise = () => {
      for (const el of [caption, cursor]) {
        if (el.matches(':popover-open')) el.hidePopover()
        el.showPopover()
      }
    }
    raise()
    document.addEventListener(
      'toggle',
      (e) => {
        const t = e as ToggleEvent & { target: HTMLElement }
        // the toasts region re-raises itself too: answering it would loop forever
        if (
          t.newState !== 'open' ||
          t.target === cursor ||
          t.target === caption
        )
          return
        if (!t.target.closest('[aria-label="Notifications"]')) raise()
      },
      true,
    )
    const w = window as any
    w.__scCaption = (who: string, what: string) => {
      caption.innerHTML = who ? `<b>${who}</b><span>${what}</span>` : ''
      if (who) caption.setAttribute('data-on', '')
      else caption.removeAttribute('data-on')
      raise()
    }
    addEventListener(
      'mousemove',
      (e) => (cursor.style.translate = `${e.clientX}px ${e.clientY}px`),
      true,
    )
    addEventListener(
      'mousedown',
      () => cursor.setAttribute('data-down', ''),
      true,
    )
    addEventListener('mouseup', () => cursor.removeAttribute('data-down'), true)
  }
  if (document.body) mount()
  else addEventListener('DOMContentLoaded', mount)
}

const caption = (page: Page, who: string, what: string) =>
  page.evaluate(
    ([who, what]) => (window as any).__scCaption(who, what),
    [who, what],
  )

// glide the cursor so a viewer can follow it
async function moveTo(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) throw new Error('no box to move to')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 10,
  })
}

async function click(page: Page, target: Locator) {
  await moveTo(page, target)
  await page.waitForTimeout(60)
  await target.click()
}

const type = (page: Page, text: string) =>
  page.keyboard.type(text, { delay: 50 })

const rows = (page: Page) => page.locator('tbody tr:not(.skeleton)')
const nav = (page: Page) => page.getByRole('list', { name: 'Entities' })
const toasts = (page: Page) =>
  page.getByRole('region', { name: 'Notifications' })
const filters = (page: Page) =>
  page.getByRole('group', { name: 'Filters' }).first()
const popover = (page: Page) => page.locator('.filter-pop')
const settings = (page: Page) => page.getByRole('dialog', { name: 'Settings' })
const locked = (page: Page) => page.getByTitle('Read only')

async function connectAs(page: Page, token: string) {
  const dialog = settings(page)
  await expect(dialog).toBeVisible()
  await click(page, page.locator('#token'))
  await page.keyboard.press('ControlOrMeta+a')
  await type(page, token)
  await page.waitForTimeout(150)
  await click(page, dialog.getByRole('button', { name: 'Connect' }))
  await expect(dialog).toBeHidden()
}

test('showcase', async ({ page, context }) => {
  test.setTimeout(120_000)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(overlay)
  const t0 = Date.now()
  const beats: { at: number; beat: string }[] = []
  const beat = (name: string) =>
    beats.push({ at: (Date.now() - t0) / 1000, beat: name })

  // prod path: the built admin served by the API, behind a token
  await page.goto('/api/admin')
  await expect(settings(page)).toBeVisible()
  await page.mouse.move(960, 700)
  beat('admin: token')
  await caption(page, 'Admin', 'signs in with a token')
  await page.waitForTimeout(300)
  await connectAs(page, 'admin')
  await expect(nav(page).getByRole('link').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Entities' })).toBeVisible()
  await caption(page, 'Admin', 'every entity, every action')
  await page.waitForTimeout(900)

  beat('admin: palette')
  await caption(page, 'Admin', 'Ctrl+K to jump')
  await page.keyboard.press('ControlOrMeta+k')
  await expect(
    page.getByRole('combobox', { name: 'Search entities and actions' }),
  ).toBeFocused()
  await page.waitForTimeout(150)
  await type(page, 'deals')
  await page.waitForTimeout(250)
  const options = await page.getByRole('option').allInnerTexts()
  const at = options.findIndex((o) => o.trim().startsWith('Deals'))
  expect(at).toBeGreaterThanOrEqual(0)
  for (let i = 0; i < at; i++) {
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(150)
  }
  await page.waitForTimeout(150)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Deals')
  await expect(rows(page)).toHaveCount(25)
  await page.waitForTimeout(300)

  beat('admin: inline edit')
  await caption(page, 'Admin', 'edit inline')
  const edited = rows(page).nth(2)
  const name = edited.getByRole('textbox', { name: 'Name' })
  await click(page, name)
  // the cursor would hide the text being typed
  const box = (await name.boundingBox())!
  await page.mouse.move(box.x + box.width + 40, box.y + box.height + 30, {
    steps: 6,
  })
  await page.keyboard.press('End')
  await type(page, ' v2')
  await expect(edited).toHaveAttribute('data-dirty', '')
  await page.waitForTimeout(250)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(edited).not.toHaveAttribute('data-dirty')
  await page.waitForTimeout(400)

  beat('admin: drawer')
  await caption(page, 'Admin', 'or open the drawer')
  await moveTo(page, rows(page).nth(1))
  await click(page, rows(page).nth(1).getByRole('button', { name: 'Open row' }))
  const drawer = page.getByRole('dialog', { name: 'Deals' })
  await expect(drawer.getByRole('textbox', { name: 'Name' })).toBeVisible()
  await page.waitForTimeout(1100)
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)

  beat('admin: date between')
  await caption(page, 'Admin', 'filter, dates between')
  await click(page, filters(page).getByRole('button', { name: 'Add filter' }))
  await type(page, 'created')
  await page.keyboard.press('Enter')
  await click(page, popover(page).getByRole('combobox', { name: 'Operator' }))
  await click(page, page.getByRole('option', { name: 'between' }))
  await click(
    page,
    popover(page).getByRole('textbox', { name: 'Created At from' }),
  )
  await popover(page)
    .getByRole('textbox', { name: 'Created At from' })
    .fill('2021-03-01')
  await page.keyboard.press('Tab')
  await popover(page)
    .getByRole('textbox', { name: 'Created At to' })
    .fill('2021-03-31')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(600)
  await click(page, popover(page).getByRole('button', { name: 'Apply' }))
  await expect(page).toHaveURL(REGEX_BETWEEN)
  await expect(
    filters(page).getByRole('button', { name: REGEX_CHIP }),
  ).toHaveCount(1)
  await page.waitForTimeout(500)

  beat('admin: copy link')
  await caption(page, 'Admin', 'copy a link to this exact view')
  await click(page, page.getByRole('button', { name: 'Copy link' }))
  await expect(toasts(page)).toContainText('Link copied')
  await page.waitForTimeout(800)

  beat('ops: token')
  await caption(page, 'Ops', 'same admin, another token')
  await click(page, page.getByRole('button', { name: 'Settings', exact: true }))
  await connectAs(page, 'ops')
  await expect(toasts(page)).toContainText('Connected as Ops')
  await click(page, page.getByRole('link', { name: 'Home' }))
  await expect(page.getByRole('heading', { name: 'Entities' })).toBeVisible()
  await caption(page, 'Ops', 'fewer entities, rights per row')
  await moveTo(page, page.locator('.grid').getByText('Per row').first())
  await page.waitForTimeout(1300)

  beat('ops: contacts drawer only')
  await caption(page, 'Ops', 'contacts: drawer only, no delete')
  await click(
    page,
    nav(page).getByRole('link', { name: 'Contacts', exact: true }),
  )
  await expect(rows(page).first()).toBeVisible()
  await page.waitForTimeout(200)
  await click(page, rows(page).first().locator('td').nth(2))
  const contact = page.getByRole('dialog', { name: 'Contacts' })
  await expect(
    contact.getByRole('textbox', { name: 'Last Name' }),
  ).toBeVisible()
  await page.waitForTimeout(1100)
  await page.keyboard.press('Escape')
  await expect(contact).toHaveCount(0)

  beat('ops: deals per row')
  await caption(page, 'Ops', 'deals: edit and delete only their own')
  await click(page, nav(page).getByRole('link', { name: 'Deals', exact: true }))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Deals')
  await expect(rows(page)).toHaveCount(25)
  await expect(locked(page).first()).toBeVisible()
  // the per row answer: a lock on rows owned by others, delete on their own
  const other = rows(page)
    .filter({ has: locked(page) })
    .first()
  const owned = rows(page)
    .filter({ hasNot: locked(page) })
    .first()
  await moveTo(page, other.getByTitle('Read only'))
  await page.waitForTimeout(500)
  await click(page, other.getByRole('button', { name: 'Open row' }))
  const deal = page.getByRole('dialog', { name: 'Deals' })
  await expect(deal.getByText('Read only')).toBeVisible()
  await page.waitForTimeout(1300)
  await page.keyboard.press('Escape')
  await expect(deal).toHaveCount(0)
  const del = owned.getByRole('button', { name: 'Delete row' })
  await moveTo(page, owned.getByRole('textbox', { name: 'Name' }))
  await expect(del).toBeVisible()
  await page.waitForTimeout(1300)

  beat('closing card')
  await page.setContent(closingCard())
  await page.waitForTimeout(3500)
  beat('end')

  // seconds from the first navigation: where to cut the video
  console.log(`BEATS ${JSON.stringify(beats)}`)
})

const LOGO = readFileSync(
  join(process.cwd(), 'src/lib/shell/Logo.svelte'),
  'utf8',
)
  .split('<style>')[0]
  .replace('width="18"', 'width="112"')
  .replace('height="18"', 'height="112"')

function closingCard() {
  return `<!doctype html>
<html><head><style>
  :root { --bg: oklch(0.99 0.002 255); --text: oklch(0.24 0.012 260); --muted: oklch(0.47 0.014 260); --accent: oklch(0.52 0.16 262); }
  html, body { height: 100%; margin: 0; }
  body { display: grid; place-items: center; background: var(--bg); color: var(--text);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .card { display: flex; flex-direction: column; align-items: center; gap: 28px; animation: in 600ms cubic-bezier(0.2, 0, 0, 1) both; }
  .mark { color: var(--accent); }
  h1 { margin: 0; font-size: 104px; font-weight: 650; letter-spacing: -0.03em; }
  p { margin: -12px 0 0; font-size: 44px; color: var(--muted); letter-spacing: -0.01em; }
  @keyframes in { from { opacity: 0; translate: 0 12px; } }
</style></head>
<body><div class="card"><span class="mark">${LOGO}</span><h1>Remult Admin</h1><p>In prod, following your access</p></div></body></html>`
}
