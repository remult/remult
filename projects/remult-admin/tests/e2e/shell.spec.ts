import { expect, test, type Page } from '@playwright/test'

const KEY = 'RemultAdmin_2026_11'
const REGEX_TASKS_URL = /#\/entity\/tasks$/

async function signInAs(page: Page, token: string) {
  await page.addInitScript(
    ([key, token]) =>
      sessionStorage.setItem(key, JSON.stringify({ bearerAuth: token })),
    [KEY, token],
  )
}

const navList = (page: Page) => page.getByRole('list', { name: 'Entities' })
const navLinks = (page: Page) => navList(page).getByRole('link')

test('nav filter narrows the entity list', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/')
  await expect(navLinks(page).first()).toBeVisible()
  const all = await navLinks(page).count()

  await page.getByRole('searchbox', { name: 'Filter entities' }).fill('deal')
  await expect(navLinks(page)).toHaveCount(2)
  expect(all).toBeGreaterThan(2)
  for (const text of await navLinks(page).allInnerTexts())
    expect(text.toLowerCase()).toContain('deal')

  await page.getByRole('searchbox', { name: 'Filter entities' }).fill('zzz')
  await expect(navList(page)).toContainText('No entity matches')
})

test('Cmd/Ctrl+K opens an entity', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/')
  await expect(navLinks(page).first()).toBeVisible()

  await page.keyboard.press('ControlOrMeta+k')
  const search = page.getByRole('combobox', {
    name: 'Search entities and actions',
  })
  await expect(search).toBeFocused()
  await search.fill('tasks')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(REGEX_TASKS_URL)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tasks')
  await expect(
    navList(page).getByRole('link', { name: 'Tasks' }),
  ).toHaveAttribute('aria-current', 'page')
})

test('entities hidden by the server hook are absent from nav and palette', async ({
  page,
}) => {
  await signInAs(page, 'ops')
  await page.goto('/')
  await expect(navLinks(page).first()).toBeVisible()
  await expect(
    navList(page).getByRole('link', { name: 'Stories' }),
  ).toHaveCount(0)
  await expect(navList(page).getByRole('link', { name: 'Nonos' })).toHaveCount(
    0,
  )
  await expect(navList(page).getByRole('link', { name: 'Tasks' })).toHaveCount(
    1,
  )

  await page.keyboard.press('ControlOrMeta+k')
  await page
    .getByRole('combobox', { name: 'Search entities and actions' })
    .fill('stories')
  await expect(page.getByRole('option')).toHaveCount(0)
  await expect(page.getByText('No match for "stories".')).toBeVisible()
})

test('admin sees the entities ops does not', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/')
  await expect(
    navList(page).getByRole('link', { name: 'Stories' }),
  ).toHaveCount(1)
})

test('requireAuthToken prompts for a token, then loads entities', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.optionsFromServer = {
      rootPath: '/api',
      requireAuthToken: true,
      disableLiveQuery: false,
    }
  })
  await page.goto('/')

  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await expect(dialog).toBeVisible()
  await expect(navLinks(page)).toHaveCount(0)
  await expect(page.locator('#token')).toBeFocused()

  await page.locator('#token').fill('nobody')
  await dialog.getByRole('button', { name: 'Connect' }).click()
  await expect(dialog.getByRole('alert')).toContainText('rejected')

  await page.locator('#token').fill('ops')
  await dialog.getByRole('button', { name: 'Connect' }).click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole('region', { name: 'Notifications' }),
  ).toContainText('Connected as Ops')
  await expect(navList(page).getByRole('link', { name: 'Tasks' })).toBeVisible()
})

test('a 401 reopens settings', async ({ page }) => {
  await signInAs(page, 'expired')
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
})

test('theme setting drives data-theme', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).not.toHaveAttribute('data-theme')

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await dialog.getByText('Dark', { exact: true }).click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await dialog.getByText('Light', { exact: true }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await dialog.getByText('System', { exact: true }).click()
  await expect(html).not.toHaveAttribute('data-theme')
})

test('Home restores the last location when the app opens on it', async ({
  page,
}) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/tasks')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tasks')
  await page.goto('/#/')
  await expect(page).toHaveURL(REGEX_TASKS_URL)

  await navList(page).getByRole('link', { name: 'Deals' }).click()
  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entities')
})
