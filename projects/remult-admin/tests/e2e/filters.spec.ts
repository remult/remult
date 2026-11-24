import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KEY = 'RemultAdmin_2026_11'
// demo company with stories (a hidden entity for 'ops'), first by name
const ABSHIRE = '21ef1df0-2f2a-430e-8cd5-a85eae47ac5e'
const BASHIRIAN = 'id:a0bfee87-492b-4377-80b2-ca232774e0a3'

const REGEX_CREATED_BETWEEN = /createdAt\.gte=2021-03-01&createdAt\.lte=2021-03-31/
const REGEX_STATUS_IN = /status\.in=/
const REGEX_COMPANY_IN = /company\.in=/
const REGEX_RANGE = /^(\d+) - (\d+) of (\d+)$/
const REGEX_CHIP = /^Filter: /
const REGEX_BASHIRIAN_OPTION = /^Bashirian LLC$/

// a test that writes re-serializes the json file: put it back as it was
const DB_FILES = ['deals.json'].map((f) => join(process.cwd(), 'db', f))
const saved = new Map<string, string>()
test.beforeAll(() => {
  for (const f of DB_FILES) saved.set(f, readFileSync(f, 'utf8'))
})
test.afterAll(() => {
  for (const [f, content] of saved) writeFileSync(f, content)
})

async function signInAs(target: Page | BrowserContext, token: string) {
  await target.addInitScript(
    ([key, token]) => sessionStorage.setItem(key, JSON.stringify({ bearerAuth: token })),
    [KEY, token],
  )
}

const rows = (page: Page) => page.locator('section.table:not(.nested) > .scroll > table > tbody > tr.row')
const range = (page: Page) => page.locator('section.table:not(.nested) .range').first()
const filters = (page: Page) => page.getByRole('group', { name: 'Filters' }).first()
const chips = (page: Page) => filters(page).getByRole('button', { name: REGEX_CHIP })

async function count(page: Page, entity: string, params: Record<string, string>, token = 'admin') {
  const qs = new URLSearchParams({ ...params, __action: 'count' })
  const res = await page.request.get(`/api/${entity}?${qs}`, { headers: { authorization: `Bearer ${token}` } })
  expect(res.ok()).toBe(true)
  return ((await res.json()) as { count: number }).count
}

async function expectTotal(page: Page, total: number) {
  await expect(range(page)).toHaveText(REGEX_RANGE)
  await expect.poll(async () => Number(REGEX_RANGE.exec((await range(page).textContent()) ?? '')?.[3])).toBe(total)
}

async function addFilter(page: Page, field: string) {
  await filters(page).getByRole('button', { name: 'Add filter' }).click()
  await page.getByRole('searchbox', { name: 'Find a field' }).fill(field)
  await page.keyboard.press('Enter')
}

const popover = (page: Page) => page.locator('.filter-pop')

test('date between chip: URL gets .gte and .lte, rows are filtered, the copied link shows the same', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await signInAs(context, 'admin')
  await page.goto('/#/entity/deals')
  await expect(rows(page).first()).toBeVisible()

  await addFilter(page, 'Created At')
  await popover(page).getByRole('combobox', { name: 'Operator' }).click()
  await page.getByRole('option', { name: 'between' }).click()
  await popover(page).getByRole('textbox', { name: 'Created At from' }).fill('2021-03-01')
  await page.keyboard.press('Tab')
  await popover(page).getByRole('textbox', { name: 'Created At to' }).fill('2021-03-31')
  await page.keyboard.press('Tab')
  await popover(page).getByRole('button', { name: 'Apply' }).click()

  await expect(page).toHaveURL(REGEX_CREATED_BETWEEN)
  await expect(chips(page)).toHaveCount(1)
  await expect(chips(page).first()).toContainText('Created At between')
  await expect(chips(page).first()).not.toContainText('2021-03')
  // the viewer's local days, like the admin sends them
  const expected = await count(page, 'deals', {
    'createdAt.gte': new Date(2021, 2, 1).toISOString(),
    'createdAt.lte': new Date(2021, 2, 31, 23, 59, 59, 999).toISOString(),
  })
  expect(expected).toBeGreaterThan(0)
  await expectTotal(page, expected)

  await page.getByRole('button', { name: 'Copy link' }).click()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toMatch(REGEX_CREATED_BETWEEN)

  const other = await context.newPage()
  await other.goto(link)
  await expect(chips(other)).toHaveCount(1)
  await expect(chips(other).first()).toHaveText(await chips(page).first().innerText())
  await expectTotal(other, expected)
  await other.close()
})

test('enum "is any of" with two values', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/contacts')
  await expect(rows(page).first()).toBeVisible()

  await addFilter(page, 'Status')
  await popover(page).getByRole('checkbox', { name: 'Cold' }).check()
  await popover(page).getByRole('checkbox', { name: 'Hot' }).check()
  await popover(page).getByRole('button', { name: 'Apply' }).click()

  await expect(page).toHaveURL(REGEX_STATUS_IN)
  await expect(chips(page).first()).toContainText('Status is any of Cold, Hot')
  await expectTotal(page, await count(page, 'contacts', { 'status.in': JSON.stringify(['cold', 'hot']) }))

  // edit in place: drop one value
  await chips(page).first().click()
  await popover(page).getByRole('checkbox', { name: 'Hot' }).uncheck()
  await popover(page).getByRole('button', { name: 'Apply' }).click()
  await expect(chips(page)).toHaveCount(1)
  await expect(chips(page).first()).toContainText('Status is any of Cold')
  await expectTotal(page, await count(page, 'contacts', { status: 'cold' }))

  await filters(page).getByRole('button', { name: 'Clear all' }).click()
  await expect(chips(page)).toHaveCount(0)
})

test('relation chip by search shows the caption, also from a fresh link', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/contacts')
  await expect(rows(page).first()).toBeVisible()

  await addFilter(page, 'Company')
  await popover(page).getByRole('searchbox', { name: 'Search Company' }).fill('Bashirian')
  await popover(page).getByRole('checkbox', { name: REGEX_BASHIRIAN_OPTION }).check()
  await popover(page).getByRole('button', { name: 'Apply' }).click()

  await expect(page).toHaveURL(REGEX_COMPANY_IN)
  await expect(chips(page).first()).toContainText('Company is any of Bashirian LLC')
  await expect(chips(page).first()).not.toContainText(BASHIRIAN)
  const expected = await count(page, 'contacts', { 'companyId.in': JSON.stringify([BASHIRIAN]) })
  await expectTotal(page, expected)
  // the relation targets Company.companyId ('id:' + id), not Company.id: the cell still shows the name
  await expect(rows(page).first().getByRole('button', { name: 'Company: Bashirian LLC' })).toBeVisible()

  // a reload knows only the id: the caption is looked up
  await page.reload()
  await expect(chips(page).first()).toContainText('Company is any of Bashirian LLC')
  await expectTotal(page, expected)
})

test('to-one editor: search, pick, the cell shows the caption, Save writes the id', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/deals?_sort=name&_order=asc')
  const row = rows(page).first()
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Company:' }).click()
  await page.getByRole('combobox', { name: 'Search Company' }).fill('Bashirian LLC')
  await page.getByRole('option', { name: REGEX_BASHIRIAN_OPTION }).click()
  await expect(row.getByRole('button', { name: 'Company:' })).toContainText('Bashirian LLC')
  await expect(row).toHaveAttribute('data-dirty', '')

  await row.getByRole('button', { name: 'Save' }).click()
  await expect(row).not.toHaveAttribute('data-dirty')
  const res = await page.request.get('/api/deals?_sort=name&_order=asc&_limit=1', {
    headers: { authorization: 'Bearer admin' },
  })
  expect((await res.json())[0].company).toBe(BASHIRIAN.slice(3))
})

test('as ops, the nested relation of a hidden entity loads', async ({ page }) => {
  await signInAs(page, 'ops')
  await page.goto('/#/entity/companies')
  // stories are hidden for ops: not in the nav
  await expect(page.getByRole('link', { name: 'Stories' })).toHaveCount(0)
  const first = rows(page).first()
  await expect(first).toHaveAttribute('data-row', ABSHIRE)

  await first.getByRole('button', { name: 'Show related rows' }).click()
  const related = page.locator('tr.related')
  await expect(related.getByRole('tab', { name: 'Contacts', exact: true })).toHaveAttribute('aria-selected', 'true')
  await related.getByRole('tab', { name: 'Stories' }).click()

  const nested = related.locator('section.table.nested')
  await expect(nested.locator('tbody tr.row')).toHaveCount(2)
  await expect(nested).toContainText('Kickoff call went well')
  // the admin's own story stays out: the server prefilter still applies
  await expect(nested).not.toContainText('Board review scheduled')

  await first.getByRole('button', { name: 'Hide related rows' }).click()
  await expect(related).toHaveCount(0)
})
