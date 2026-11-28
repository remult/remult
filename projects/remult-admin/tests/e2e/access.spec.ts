import { expect, test, type Page } from '@playwright/test'

const KEY = 'RemultAdmin_2026_11'
// set to save a screenshot of the open panel
const SHOT = process.env.ACCESS_SHOT

async function signInAs(page: Page, token: string) {
  await page.addInitScript(
    ([key, token]) =>
      sessionStorage.setItem(key, JSON.stringify({ bearerAuth: token })),
    [KEY, token],
  )
}

const panel = (page: Page) => page.getByRole('dialog', { name: 'Your access' })

async function openPanel(page: Page, name: string) {
  await page.getByRole('button', { name: `Your access, ${name}` }).click()
  await expect(panel(page)).toBeVisible()
  return panel(page)
}

test('admin sees their name and role', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/')
  const p = await openPanel(page, 'Admin')
  await expect(p.getByTestId('access-name')).toHaveText('Admin')
  await expect(p.getByRole('list', { name: 'Roles' })).toHaveText('admin')
})

test('ops: no roles, deals prefiltered, update and delete by a function', async ({
  page,
}) => {
  await signInAs(page, 'ops')
  await page.goto('/#/')

  const home = page
    .locator('table.grid')
    .getByRole('row')
    .filter({
      has: page.getByRole('link', { name: 'Deals', exact: true }),
    })
  const marks = home.getByRole('cell').getByRole('img')
  await expect(marks).toHaveCount(4)
  await expect(marks.nth(1)).toHaveAccessibleName('Yes, prefiltered')
  await expect(marks.nth(2)).toHaveAccessibleName('Function')
  await expect(page.getByRole('button', { name: "Ops's access" })).toBeVisible()

  const p = await openPanel(page, 'Ops')
  await expect(p.getByTestId('access-name')).toHaveText('Ops')
  await expect(p.getByText('No roles')).toBeVisible()

  const deals = p.getByRole('row').filter({
    has: page.getByRole('link', { name: 'Deals', exact: true }),
  })
  const cells = deals.getByRole('cell')
  await expect(cells.nth(0).getByRole('img')).toHaveAccessibleName('Yes')
  await expect(cells.nth(1).getByRole('img')).toHaveAccessibleName(
    'Yes, prefiltered',
  )
  await expect(cells.nth(2).getByRole('img')).toHaveAccessibleName('Function')
  await expect(cells.nth(3).getByRole('img')).toHaveAccessibleName('Function')
  if (SHOT) await p.screenshot({ path: SHOT })

  await deals.getByRole('link', { name: 'Deals', exact: true }).click()
  await expect(panel(page)).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Deals')
})

test('anonymous when the token is unknown', async ({ page }) => {
  await signInAs(page, 'nobody')
  await page.goto('/#/')
  // the rejected token opens settings first
  const settings = page.getByRole('dialog', { name: 'Settings' })
  await expect(settings).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(settings).toBeHidden()
  const p = await openPanel(page, 'Anonymous')
  await expect(p.getByTestId('access-name')).toHaveText('Anonymous')
})
