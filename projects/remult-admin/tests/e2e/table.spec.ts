import { expect, test, type Page } from '@playwright/test'

const KEY = 'RemultAdmin_2026_11'
// demo: the account manager whose deals 'ops' owns
const OPS_AM = 'db2751a2-5a29-4820-84b6-8d4a378bf463'

const REGEX_SORT_NAME_DESC = /_sort=name&_order=desc/
const REGEX_SORT_NAME_ASC = /_sort=name&_order=asc/
const REGEX_NO_SORT = /#\/entity\/deals$/
const REGEX_PAGE_2 = /_page=2/
const REGEX_RANGE_26_50 = /^26 - 50 of \d+$/
const REGEX_RANGE_1_25 = /^1 - 25 of \d+$/
const REGEX_STAGE_WON = /stage=won/
const REGEX_CHIP = /^Filter: /

async function signInAs(
  page: Page,
  token: string,
  options?: { disableLiveQuery: boolean },
) {
  await page.addInitScript(
    ([key, token, options]) => {
      sessionStorage.setItem(key, JSON.stringify({ bearerAuth: token }))
      if (options)
        window.optionsFromServer = {
          rootPath: '/api',
          requireAuthToken: false,
          ...options,
        }
    },
    [KEY, token, options] as const,
  )
}

const rows = (page: Page) => page.locator('tbody tr:not(.skeleton)')
const range = (page: Page) => page.locator('.range')

async function columnTexts(page: Page, caption: string) {
  const headers = await page.locator('thead th').allInnerTexts()
  const i = headers.findIndex((h) => h.trim() === caption)
  expect(i).toBeGreaterThan(0)
  // inline mode: a cell shows its value in an editor, not as text
  return page
    .locator(`tbody tr td:nth-child(${i + 1})`)
    .evaluateAll((tds) =>
      tds.map(
        (td) =>
          (td.querySelector('input') as HTMLInputElement | null)?.value ??
          (td as HTMLElement).innerText.trim(),
      ),
    )
}

async function api(page: Page, path: string, token = 'admin') {
  const res = await page.request.get(`/api${path}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  expect(res.ok()).toBe(true)
  return res.json()
}

test('sort click cycles desc, asc, none and updates the URL and order', async ({
  page,
}) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/deals')
  await expect(rows(page)).toHaveCount(25)
  const sortName = page
    .getByRole('columnheader', { name: 'Name' })
    .getByRole('button')

  await sortName.click()
  await expect(page).toHaveURL(REGEX_SORT_NAME_DESC)
  await expect(
    page.getByRole('columnheader', { name: 'Name' }),
  ).toHaveAttribute('aria-sort', 'descending')
  const expected = await api(page, '/deals?_sort=name&_order=desc&_limit=25')
  await expect
    .poll(() => columnTexts(page, 'Name'))
    .toEqual(expected.map((d: any) => d.name))

  await sortName.click()
  await expect(page).toHaveURL(REGEX_SORT_NAME_ASC)
  const asc = await api(page, '/deals?_sort=name&_order=asc&_limit=25')
  await expect
    .poll(() => columnTexts(page, 'Name'))
    .toEqual(asc.map((d: any) => d.name))

  await sortName.click()
  await expect(page).toHaveURL(REGEX_NO_SORT)
  await expect(
    page.getByRole('columnheader', { name: 'Name' }),
  ).not.toHaveAttribute('aria-sort')
})

test('page 2 from the URL loads rows 26-50, and reload keeps sort and page', async ({
  page,
}) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/deals?_sort=name&_order=desc&_page=2')
  await expect(range(page)).toHaveText(REGEX_RANGE_26_50)
  const expected = await api(
    page,
    '/deals?_sort=name&_order=desc&_limit=25&_page=2',
  )
  await expect
    .poll(() => columnTexts(page, 'Name'))
    .toEqual(expected.map((d: any) => d.name))

  await page.reload()
  await expect(page).toHaveURL(REGEX_PAGE_2)
  await expect(range(page)).toHaveText(REGEX_RANGE_26_50)
  await expect(
    page.getByRole('columnheader', { name: 'Name' }),
  ).toHaveAttribute('aria-sort', 'descending')

  await page.getByRole('button', { name: 'Previous page' }).click()
  await expect(page).not.toHaveURL(REGEX_PAGE_2)
  await expect(range(page)).toHaveText(REGEX_RANGE_1_25)
})

test('back button restores the previous filter', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/deals?stage=won')
  await expect(page.getByLabel('Filters')).toContainText('Stage is "won"')
  await expect
    .poll(async () => new Set(await columnTexts(page, 'Stage')))
    .toEqual(new Set(['won']))

  await page
    .getByLabel('Filters')
    .getByRole('button', { name: 'Clear all' })
    .click()
  await expect(page).not.toHaveURL(REGEX_STAGE_WON)
  await expect(
    page.getByLabel('Filters').getByRole('button', { name: REGEX_CHIP }),
  ).toHaveCount(0)
  await expect
    .poll(async () => new Set(await columnTexts(page, 'Stage')).size)
    .toBeGreaterThan(1)

  await page.goBack()
  await expect(page).toHaveURL(REGEX_STAGE_WON)
  await expect(page.getByLabel('Filters')).toContainText('Stage is "won"')
  await expect
    .poll(async () => new Set(await columnTexts(page, 'Stage')))
    .toEqual(new Set(['won']))
})

test('as ops, the server refuses deleting a deal not owned', async ({
  page,
}) => {
  await signInAs(page, 'ops')
  const owned = encodeURIComponent(JSON.stringify([OPS_AM]))

  await page.goto(`/#/entity/deals?accountManager.nin=${owned}`)
  await expect(rows(page)).toHaveCount(25)
  // a function rule: the UI leaves delete open, the server decides
  await rows(page).first().hover()
  await rows(page).first().getByRole('button', { name: 'Delete row' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(
    page.getByRole('region', { name: 'Notifications' }),
  ).toContainText('Delete failed')
  await expect(rows(page)).toHaveCount(25)
})

test('entity without insert, update or delete hides New and delete', async ({
  page,
}) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/stories')
  await expect(
    page.getByText('Read only', { exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'New' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete row' })).toHaveCount(0)
})

test('a filter with no match shows the empty state', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/tasks?title=no-such-task-zz')
  await expect(page.getByRole('heading', { name: 'No rows' })).toBeVisible()
  await expect(page.getByText('Nothing matches these filters.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'New' }).first()).toBeVisible()
})

test('delete with confirm removes the row (live query off)', async ({
  page,
}) => {
  await signInAs(page, 'admin', { disableLiveQuery: true })
  const tag = `e2e-delete-${Date.now()}`
  const res = await page.request.post('/api/tags', {
    headers: { authorization: 'Bearer admin' },
    data: { tag, color: '#000000' },
  })
  expect(res.ok()).toBe(true)

  await page.goto(`/#/entity/tags?tag=${tag}`)
  await expect(rows(page)).toHaveCount(1)
  await expect(page.getByText('Live', { exact: true })).toHaveCount(0)

  await rows(page).hover()
  await page.getByRole('button', { name: 'Delete row' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(
    page.getByRole('region', { name: 'Notifications' }),
  ).toContainText('Row deleted')
  await expect(page.getByRole('heading', { name: 'No rows' })).toBeVisible()
  expect(await api(page, `/tags?tag=${tag}`)).toEqual([])
})
