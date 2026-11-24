import { expect, test, type Page } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KEY = 'RemultAdmin_2026_11'
// demo: the account manager whose deals 'ops' owns
const OPS_AM = 'db2751a2-5a29-4820-84b6-8d4a378bf463'
const REGEX_NEW_TASKS = /New Tasks/
const REGEX_DISCARD = /Discard your changes/
const REGEX_DELETE = /Delete this row/

async function signInAs(page: Page, token: string) {
  await page.addInitScript(
    ([key, token]) =>
      sessionStorage.setItem(key, JSON.stringify({ bearerAuth: token })),
    [KEY, token],
  )
}

const rows = (page: Page) => page.locator('tbody tr:not(.skeleton)')
const drawer = (page: Page, name: string | RegExp = 'Tasks') =>
  page.getByRole('dialog', { name })
const toasts = (page: Page) =>
  page.getByRole('region', { name: 'Notifications' })
const auth = { authorization: 'Bearer admin' }

async function createTask(page: Page, title: string) {
  const res = await page.request.post('/api/tasks', {
    headers: auth,
    data: { title },
  })
  expect(res.ok()).toBe(true)
  return (await res.json()) as { id: number; title: string }
}

async function tasksTitled(page: Page, prefix: string) {
  const res = await page.request.get(
    `/api/tasks?title.startsWith=${encodeURIComponent(prefix)}`,
    { headers: auth },
  )
  expect(res.ok()).toBe(true)
  return (await res.json()) as { id: number; title: string; done: boolean }[]
}

// any write re-serializes the whole json file: put the touched files back as they were
const DB_FILES = ['tasks.json', 'contacts.json', 'deals.json'].map((f) =>
  join(process.cwd(), 'db', f),
)
const saved = new Map<string, string>()
test.beforeAll(() => {
  for (const f of DB_FILES) saved.set(f, readFileSync(f, 'utf8'))
})
test.afterAll(() => {
  for (const [f, content] of saved) writeFileSync(f, content)
})

async function cleanup(page: Page, prefix: string) {
  for (const t of await tasksTitled(page, prefix))
    await page.request.delete(`/api/tasks/${t.id}`, { headers: auth })
}

async function useDrawerMode(page: Page) {
  await page
    .getByRole('radiogroup', { name: 'Edit mode' })
    .getByText('Drawer')
    .click()
  await expect(page.locator('tbody').getByRole('textbox')).toHaveCount(0)
}

test('the open button opens the drawer with the row values', async ({
  page,
}) => {
  const prefix = `e2e-drawer-open-${Date.now()}`
  await signInAs(page, 'admin')
  const task = await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)
    await rows(page).first().hover()
    await rows(page).first().getByRole('button', { name: 'Open row' }).click()

    const d = drawer(page)
    await expect(d).toBeVisible()
    await expect(
      d.getByRole('button', { name: `Copy id ${task.id}` }),
    ).toBeVisible()
    await expect(d.getByRole('textbox', { name: 'Title' })).toHaveValue(prefix)
    await expect(d.getByRole('textbox', { name: 'Title' })).toBeFocused()
    await expect(d.getByRole('switch', { name: 'Done' })).not.toBeChecked()
    // server filled fields are read only
    await expect(d.locator('#drawer-tasks-createdAt')).not.toHaveAttribute(
      'data-cell-focus',
    )
    await expect(d.getByRole('button', { name: 'Save' })).toBeDisabled()
    await expect(d.getByRole('button', { name: 'Delete row' })).toBeVisible()
    await expect(rows(page).first()).toHaveAttribute('data-active', '')

    // clean: Esc closes without asking
    await page.keyboard.press('Escape')
    await expect(d).toHaveCount(0)
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  } finally {
    await cleanup(page, prefix)
  }
})

test('edit and save updates the table row', async ({ page }) => {
  const prefix = `e2e-drawer-save-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)
    await rows(page).first().hover()
    await rows(page).first().getByRole('button', { name: 'Open row' }).click()

    const d = drawer(page)
    await d.getByRole('textbox', { name: 'Title' }).fill(`${prefix}-edited`)
    await d.getByRole('switch', { name: 'Done' }).check()
    await expect(d.locator('#drawer-tasks-title')).toBeVisible()
    await expect(d.getByRole('button', { name: 'Save' })).toBeEnabled()
    await d.getByRole('button', { name: 'Save' }).click()

    await expect(d).toHaveCount(0)
    await expect(toasts(page).getByText('Row saved')).toBeVisible()
    await expect(
      rows(page).first().getByRole('textbox', { name: 'Title' }),
    ).toHaveValue(`${prefix}-edited`)
    await expect(rows(page).first()).not.toHaveAttribute('data-dirty')
    await expect
      .poll(async () => (await tasksTitled(page, prefix))[0])
      .toMatchObject({ title: `${prefix}-edited`, done: true })
  } finally {
    await cleanup(page, prefix)
  }
})

test('a validation error shows under the field, Ctrl+Enter saves', async ({
  page,
}) => {
  const prefix = `e2e-drawer-invalid-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)
    await rows(page).first().hover()
    await rows(page).first().getByRole('button', { name: 'Open row' }).click()

    const d = drawer(page)
    const title = d.getByRole('textbox', { name: 'Title' })
    await title.fill('')
    await page.keyboard.press('ControlOrMeta+Enter')
    await expect(title).toHaveAttribute('aria-invalid', 'true')
    await expect(d.locator('#drawer-tasks-title-error')).toContainText('empty')
    await expect(d).toBeVisible()

    await title.fill(`${prefix}-fixed`)
    await expect(d.locator('#drawer-tasks-title-error')).toHaveCount(0)
    await page.keyboard.press('ControlOrMeta+Enter')
    await expect(d).toHaveCount(0)
    await expect
      .poll(async () => (await tasksTitled(page, prefix))[0]?.title)
      .toBe(`${prefix}-fixed`)
  } finally {
    await cleanup(page, prefix)
  }
})

test('Esc with unsaved changes asks before discarding', async ({ page }) => {
  const prefix = `e2e-drawer-guard-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)
    await rows(page).first().hover()
    await rows(page).first().getByRole('button', { name: 'Open row' }).click()

    const d = drawer(page)
    const title = d.getByRole('textbox', { name: 'Title' })
    await title.fill(`${prefix}-unsaved`)

    await page.keyboard.press('Escape')
    const ask = page.getByRole('alertdialog', { name: REGEX_DISCARD })
    await expect(ask).toBeVisible()
    await ask.getByRole('button', { name: 'Keep editing' }).click()
    await expect(ask).toHaveCount(0)
    await expect(title).toHaveValue(`${prefix}-unsaved`)

    // the close button asks too
    await d.getByRole('button', { name: 'Close' }).click()
    await ask.getByRole('button', { name: 'Discard' }).click()
    await expect(d).toHaveCount(0)
    await expect(
      rows(page).first().getByRole('textbox', { name: 'Title' }),
    ).toHaveValue(prefix)
    await expect(rows(page).first()).not.toHaveAttribute('data-dirty')
    expect((await tasksTitled(page, prefix))[0].title).toBe(prefix)
  } finally {
    await cleanup(page, prefix)
  }
})

test('drawer mode: row click and Enter open, New opens a create drawer that inserts', async ({
  page,
}) => {
  const prefix = `e2e-drawer-create-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, `${prefix}-a`)
  await createTask(page, `${prefix}-b`)
  try {
    await page.goto(
      `/#/entity/tasks?title.startsWith=${prefix}&_sort=title&_order=asc`,
    )
    await expect(rows(page)).toHaveCount(2)
    await useDrawerMode(page)

    await rows(page).nth(1).getByText(`${prefix}-b`).click()
    await expect(
      drawer(page).getByRole('textbox', { name: 'Title' }),
    ).toHaveValue(`${prefix}-b`)
    await page.keyboard.press('Escape')
    await expect(drawer(page)).toHaveCount(0)

    // keyboard: focus a row, arrow to the next one, Enter opens it
    await rows(page).first().focus()
    await page.keyboard.press('ArrowDown')
    await expect(rows(page).nth(1)).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await expect(
      drawer(page).getByRole('textbox', { name: 'Title' }),
    ).toHaveValue(`${prefix}-a`)
    await page.keyboard.press('Escape')
    await expect(drawer(page)).toHaveCount(0)

    await page.getByRole('button', { name: 'New' }).click()
    const d = drawer(page, REGEX_NEW_TASKS)
    await expect(d).toBeVisible()
    // nothing the server fills, and no ghost row in the table
    await expect(d.locator('#drawer-tasks-id')).toHaveCount(0)
    await expect(d.locator('#drawer-tasks-createdAt')).toHaveCount(0)
    await expect(page.locator('tbody tr[data-new]')).toHaveCount(0)
    await d.getByRole('textbox', { name: 'Title' }).fill(`${prefix}-c`)
    await d.getByRole('button', { name: 'Create' }).click()
    await expect(d).toHaveCount(0)
    await expect(toasts(page).getByText('Row added')).toBeVisible()
    await expect(rows(page)).toHaveCount(3)
    await expect
      .poll(async () => (await tasksTitled(page, `${prefix}-c`)).length)
      .toBe(1)
  } finally {
    await cleanup(page, prefix)
  }
})

test('inline mode: Space on a focused row opens it, not inside an editor', async ({
  page,
}) => {
  const prefix = `e2e-drawer-space-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)
    const title = rows(page).first().getByRole('textbox', { name: 'Title' })
    await title.focus()
    await page.keyboard.press('Space')
    await expect(drawer(page)).toHaveCount(0)
    await expect(title).toHaveValue(`${prefix} `)
    await page.keyboard.press('Escape')

    await rows(page).first().focus()
    await page.keyboard.press('Space')
    await expect(drawer(page)).toBeVisible()
  } finally {
    await cleanup(page, prefix)
  }
})

test('ops on contacts: locked drawer opens on click, without delete', async ({
  page,
}) => {
  await signInAs(page, 'ops')
  await page.goto('/#/entity/contacts')
  await expect(rows(page).first()).toBeVisible()
  await rows(page).first().locator('td').nth(2).click()
  const d = drawer(page, 'Contacts')
  await expect(d).toBeVisible()
  await expect(d.getByRole('textbox', { name: 'Last Name' })).toBeVisible()
  await expect(d.getByRole('button', { name: 'Delete row' })).toHaveCount(0)
  await expect(d.getByRole('button', { name: 'Save' })).toBeVisible()
})

test('JSON edits in place in the drawer, invalid JSON blocks Save', async ({
  page,
}) => {
  await signInAs(page, 'admin')
  await page.goto('/#/entity/deals')
  await expect(rows(page).first()).toBeVisible()
  await rows(page).first().hover()
  await rows(page).first().getByRole('button', { name: 'Open row' }).click()
  const d = drawer(page, 'Deals')
  const items = d.getByRole('textbox', { name: 'Items', exact: true })
  await expect(items).toBeVisible()
  await items.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('[{"id": ')
  await expect(items).toHaveAttribute('aria-invalid', 'true')
  await expect(d.locator('#drawer-deals-items-error')).toBeVisible()
  await expect(d.getByRole('button', { name: 'Save' })).toBeDisabled()

  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('[{"id": 9}]')
  await expect(items).not.toHaveAttribute('aria-invalid')
  await expect(d.getByRole('button', { name: 'Save' })).toBeEnabled()
  // the row behind shares the draft
  await expect(rows(page).first()).toHaveAttribute('data-dirty', '')
  await d.getByRole('button', { name: 'Cancel' }).click()
  await expect(d).toHaveCount(0)
  await expect(rows(page).first()).not.toHaveAttribute('data-dirty')
})

test('delete from the drawer asks, then removes the row', async ({ page }) => {
  const prefix = `e2e-drawer-delete-${Date.now()}`
  await signInAs(page, 'admin')
  await createTask(page, prefix)
  try {
    await page.goto(`/#/entity/tasks?title.startsWith=${prefix}`)
    await expect(rows(page)).toHaveCount(1)
    await rows(page).first().hover()
    await rows(page).first().getByRole('button', { name: 'Open row' }).click()
    const d = drawer(page)
    await d.getByRole('button', { name: 'Delete row' }).click()
    const ask = page.getByRole('alertdialog', { name: REGEX_DELETE })
    await ask.getByRole('button', { name: 'Cancel' }).click()
    await expect(ask).toHaveCount(0)
    await expect(d).toBeVisible()
    await d.getByRole('button', { name: 'Delete row' }).click()
    await ask.getByRole('button', { name: 'Delete' }).click()
    await expect(d).toHaveCount(0)
    await expect(toasts(page).getByText('Row deleted')).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
    expect(await tasksTitled(page, prefix)).toEqual([])
  } finally {
    await cleanup(page, prefix)
  }
})

test('as ops, a deal not owned opens read only, an owned one can be edited and deleted', async ({
  page,
}) => {
  await signInAs(page, 'ops')
  const owned = encodeURIComponent(JSON.stringify([OPS_AM]))

  await page.goto(`/#/entity/deals?accountManager.nin=${owned}`)
  await expect(
    page.locator('tbody').getByTitle('Read only').first(),
  ).toBeVisible()
  await rows(page).first().hover()
  await rows(page).first().getByRole('button', { name: 'Open row' }).click()
  let d = drawer(page, 'Deals')
  await expect(d.getByText('Read only')).toBeVisible()
  await expect(d.getByRole('textbox')).toHaveCount(0)
  await expect(d.getByRole('button', { name: 'Save' })).toHaveCount(0)
  await expect(d.getByRole('button', { name: 'Delete row' })).toHaveCount(0)
  await d.getByRole('button', { name: 'Close', exact: true }).first().click()
  await expect(d).toHaveCount(0)

  await page.goto(`/#/entity/deals?accountManager.in=${owned}`)
  await expect(
    page.getByRole('button', { name: 'Delete row' }).first(),
  ).toBeVisible()
  await rows(page).first().hover()
  await rows(page).first().getByRole('button', { name: 'Open row' }).click()
  d = drawer(page, 'Deals')
  await expect(d.getByRole('textbox', { name: 'Name' })).toBeEditable()
  await expect(d.getByRole('button', { name: 'Save' })).toBeVisible()
  await expect(d.getByRole('button', { name: 'Delete row' })).toBeVisible()
})
