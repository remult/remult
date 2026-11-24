import { expect, test, type Page } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KEY = 'RemultAdmin_2026_11'
const REGEX_EMPTY = /empty/i

async function signInAs(page: Page, token: string) {
  await page.addInitScript(
    ([key, token]) => sessionStorage.setItem(key, JSON.stringify({ bearerAuth: token })),
    [KEY, token],
  )
}

const rows = (page: Page) => page.locator('tbody tr:not(.skeleton)')
const titleInput = (page: Page, i = 0) => rows(page).nth(i).getByRole('textbox', { name: 'Title' })
const auth = { authorization: 'Bearer admin' }

async function createTask(page: Page, title: string) {
  const res = await page.request.post('/api/tasks', { headers: auth, data: { title } })
  expect(res.ok()).toBe(true)
  return (await res.json()) as { id: number; title: string }
}

async function tasksTitled(page: Page, prefix: string) {
  const res = await page.request.get(`/api/tasks?title.startsWith=${encodeURIComponent(prefix)}`, { headers: auth })
  expect(res.ok()).toBe(true)
  return (await res.json()) as { id: number; title: string }[]
}

// any write re-serializes the whole json file: put the touched files back as they were
const DB_FILES = ['tasks.json', 'contacts.json'].map((f) => join(process.cwd(), 'db', f))
const saved = new Map<string, string>()
test.beforeAll(() => {
  for (const f of DB_FILES) saved.set(f, readFileSync(f, 'utf8'))
})
test.afterAll(() => {
  for (const [f, content] of saved) writeFileSync(f, content)
})

async function cleanup(page: Page, prefix: string) {
  for (const t of await tasksTitled(page, prefix)) await page.request.delete(`/api/tasks/${t.id}`, { headers: auth })
}

test('no row is dirty on arrival', async ({ page }) => {
  await signInAs(page, 'admin')
  for (const entity of ['tasks', 'contacts', 'companies', 'deals']) {
    await page.goto(`/#/entity/${entity}`)
    await expect(rows(page).first()).toBeVisible()
    // editors are mounted: give any write on mount a chance to happen
    await page.waitForTimeout(300)
    await expect(page.locator('tbody tr[data-dirty]')).toHaveCount(0)
    await expect(page.locator('tbody td[data-dirty]')).toHaveCount(0)
  }
})

test('a select with no value stays clean (green rows regression)', async ({ page }) => {
  await signInAs(page, 'admin')
  // the server can't store a null status, the file can: the API then omits the field
  const file = DB_FILES[1]
  const all = JSON.parse(readFileSync(file, 'utf8'))
  all[0].status = null
  writeFileSync(file, JSON.stringify(all, null, 2))
  await page.goto(`/#/entity/contacts?id=${all[0].id}`)
  await expect(rows(page)).toHaveCount(1)
  const status = rows(page).first().getByRole('combobox', { name: 'Status' })
  await expect(status).toHaveAttribute('data-placeholder', '')
  await page.waitForTimeout(300)
  await expect(page.locator('tbody tr[data-dirty]')).toHaveCount(0)
})

test('edit then Ctrl+Enter saves, Ctrl+Esc reverts', async ({ page }) => {
  const prefix = `e2e-inline-save-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)

    await titleInput(page).fill(`${prefix}-edited`)
    await expect(rows(page).first()).toHaveAttribute('data-dirty', '')
    await page.keyboard.press('ControlOrMeta+Enter')
    await expect(rows(page).first()).not.toHaveAttribute('data-dirty')
    await expect.poll(async () => (await tasksTitled(page, prefix))[0]?.title).toBe(`${prefix}-edited`)

    await titleInput(page).fill(`${prefix}-not-kept`)
    await expect(rows(page).first()).toHaveAttribute('data-dirty', '')
    await page.keyboard.press('ControlOrMeta+Escape')
    await expect(titleInput(page)).toHaveValue(`${prefix}-edited`)
    await expect(rows(page).first()).not.toHaveAttribute('data-dirty')
    expect((await tasksTitled(page, prefix))[0].title).toBe(`${prefix}-edited`)
  } finally {
    await cleanup(page, prefix)
  }
})

test('a validation error shows on the cell and clears on edit', async ({ page }) => {
  const prefix = `e2e-inline-invalid-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)

    await titleInput(page).fill('')
    await page.keyboard.press('ControlOrMeta+Enter')
    const cell = rows(page).first().locator('td[data-invalid]')
    await expect(cell).toHaveCount(1)
    await expect(cell).toContainText(REGEX_EMPTY)
    await expect(titleInput(page)).toHaveAttribute('aria-invalid', 'true')
    await expect(rows(page).first()).toHaveAttribute('data-dirty', '')

    await titleInput(page).fill(prefix)
    await expect(rows(page).first().locator('td[data-invalid]')).toHaveCount(0)
    expect((await tasksTitled(page, prefix))[0].title).toBe(prefix)
  } finally {
    await cleanup(page, prefix)
  }
})

test('arrow down moves to the same column on the next row', async ({ page }) => {
  const prefix = `e2e-inline-arrow-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, `${prefix}-a`)
  await createTask(page, `${prefix}-b`)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}&_sort=title&_order=asc`)
    await expect(rows(page)).toHaveCount(2)
    await titleInput(page, 0).focus()
    await page.keyboard.press('ArrowDown')
    await expect(titleInput(page, 1)).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(titleInput(page, 0)).toBeFocused()
  } finally {
    await cleanup(page, prefix)
  }
})

test('New adds a row that inserts on save', async ({ page }) => {
  const prefix = `e2e-inline-new-${Date.now()}`
  await signInAs(page, 'admin')
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(page.getByRole('heading', { name: 'No rows' })).toBeVisible()
    await page.getByRole('button', { name: 'New' }).first().click()
    const fresh = page.locator('tbody tr[data-new]')
    await expect(fresh).toHaveCount(1)
    await expect(fresh.getByRole('textbox', { name: 'Title' })).toBeFocused()
    await page.keyboard.type(prefix)
    await fresh.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('Row added')
    await expect(page.locator('tbody tr[data-new]')).toHaveCount(0)
    await expect(rows(page)).toHaveCount(1)
    await expect(titleInput(page)).toHaveValue(prefix)
    expect(await tasksTitled(page, prefix)).toHaveLength(1)
  } finally {
    await cleanup(page, prefix)
  }
})

test('edit mode switch: hidden and drawer when locked, remembered when free', async ({ page }) => {
  await signInAs(page, 'ops')
  await page.goto('/#/entity/contacts')
  await expect(rows(page).first()).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Edit mode' })).toHaveCount(0)
  // locked to drawer: cells are read only
  await expect(page.locator('tbody').getByRole('textbox')).toHaveCount(0)

  await page.goto('/#/entity/tasks')
  await expect(rows(page).first()).toBeVisible()
  const modes = page.getByRole('radiogroup', { name: 'Edit mode' })
  await expect(modes.getByRole('radio', { name: 'Inline' })).toBeChecked()
  await expect(titleInput(page)).toBeVisible()
  await modes.getByText('Drawer').click()
  await expect(page.locator('tbody').getByRole('textbox')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('radiogroup', { name: 'Edit mode' }).getByRole('radio', { name: 'Drawer' })).toBeChecked()
})

test('JSON opens in a dialog, Apply marks the row, invalid JSON blocks Apply', async ({ page }) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/deals')
  await expect(rows(page).first()).toBeVisible()
  const row = rows(page).first()
  await row.getByRole('button', { name: 'Edit Items (JSON)' }).click()
  const dialog = page.getByRole('dialog', { name: 'Items' })
  const editor = dialog.locator('.cm-content')
  await expect(editor).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('{"broken": ')
  await expect(dialog.getByRole('button', { name: 'Apply' })).toBeDisabled()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('[{"id":7}]')
  await expect(dialog.getByRole('button', { name: 'Apply' })).toBeEnabled()
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(dialog).toHaveCount(0)
  await expect(row).toHaveAttribute('data-dirty', '')
  await expect(row.getByRole('button', { name: 'Edit Items (JSON)' })).toContainText('[{"id":7}]')
  await row.getByRole('button', { name: 'Edit Items (JSON)' }).focus()
  await page.keyboard.press('ControlOrMeta+Escape')
  await expect(row).not.toHaveAttribute('data-dirty')
})
