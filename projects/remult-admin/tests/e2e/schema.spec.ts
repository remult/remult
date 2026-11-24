import { expect, test, type Page } from '@playwright/test'

const KEY = 'RemultAdmin_2026_11'
const REGEX_SCHEMA_URL = /#\/schema$/
const REGEX_DEALS_URL = /#\/entity\/deals$/
const REGEX_TRANSLATE = /translate\(([-\d.]+)px, ([-\d.]+)px\)/

async function signInAs(page: Page, token: string) {
  await page.addInitScript(
    ([key, token]) => sessionStorage.setItem(key, JSON.stringify({ bearerAuth: token })),
    [KEY, token],
  )
}

async function visibleEntities(page: Page, token: string) {
  const res = await page.request.get('/api/admin/__entities-metadata', { headers: { authorization: `Bearer ${token}` } })
  expect(res.ok()).toBe(true)
  return ((await res.json()) as { superKey: string; caption: string; hidden: boolean }[]).filter((e) => !e.hidden)
}

const nodes = (page: Page) => page.locator('.svelte-flow__node')
const node = (page: Page, superKey: string) => page.locator(`.svelte-flow__node[data-id="${superKey}"]`)

async function translate(page: Page, superKey: string) {
  const t = await node(page, superKey).evaluate((el) => (el as HTMLElement).style.transform)
  const m = REGEX_TRANSLATE.exec(t)
  expect(m).not.toBeNull()
  return { x: Number(m![1]), y: Number(m![2]) }
}

test('a node per visible entity, with its fields and relation edges', async ({ page }) => {
  await signInAs(page, 'admin')
  const visible = await visibleEntities(page, 'admin')
  await page.goto('/#/schema')
  await expect(nodes(page)).toHaveCount(visible.length)
  for (const e of visible) await expect(node(page, e.superKey).locator('.caption')).toHaveText(e.caption)
  await expect(node(page, 'deals').locator('.row', { hasText: 'Company' }).first()).toContainText('Companies')
  await expect(page.locator('.svelte-flow__edge').first()).toBeAttached()
  await expect(page.getByText(`${visible.length} entities`)).toBeVisible()
})

test('ops sees fewer nodes: hidden entities stay out', async ({ page }) => {
  await signInAs(page, 'ops')
  const admin = await visibleEntities(page, 'admin')
  const ops = await visibleEntities(page, 'ops')
  expect(ops.length).toBeLessThan(admin.length)
  await page.goto('/#/schema')
  await expect(nodes(page)).toHaveCount(ops.length)
  await expect(node(page, 'stories')).toHaveCount(0)
})

test('a node click opens the entity', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/schema')
  await node(page, 'deals').locator('.row').nth(1).click()
  await expect(page).toHaveURL(REGEX_DEALS_URL)
  await expect(page.getByRole('heading', { name: 'Deals' })).toBeVisible()
})

test('a dragged node keeps its place across reload, Reset layout puts it back', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/schema')
  await expect(nodes(page).first()).toBeVisible()
  const before = await translate(page, 'tags')
  const box = (await node(page, 'tags').locator('.row').first().boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 120, { steps: 8 })
  await page.mouse.up()
  // a drag is not a click
  await expect(page).toHaveURL(REGEX_SCHEMA_URL)
  const after = await translate(page, 'tags')
  expect(after).not.toEqual(before)
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).schemaPositions.tags, KEY)
  expect(saved).toEqual(after)

  await page.reload()
  await expect(node(page, 'tags')).toBeVisible()
  expect(await translate(page, 'tags')).toEqual(after)

  await page.getByRole('button', { name: 'Reset layout' }).click()
  await expect(page.getByRole('button', { name: 'Reset layout' })).toBeDisabled()
  expect(await translate(page, 'tags')).toEqual(before)
})

test('picking a layout arranges every node with it, moved ones too', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/schema')
  await expect(nodes(page).first()).toBeVisible()
  const box = (await node(page, 'tags').locator('.row').first().boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + 60, box.y + 200, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole('button', { name: 'Reset layout' })).toBeEnabled()

  await page.getByRole('radiogroup', { name: 'Layout' }).getByText('Line').click()
  await expect(page.getByRole('button', { name: 'Reset layout' })).toBeDisabled()
  await expect(node(page, 'tags')).toBeVisible()
  const ys = await nodes(page).evaluateAll((els) => els.map((el) => (el as HTMLElement).style.transform.split(', ')[1]))
  expect(new Set(ys)).toEqual(new Set(['0px)']))
})
