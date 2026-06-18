// Exercises Link Deck in a real browser, including smoke flows and screenshots.

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const screenshotDir = path.resolve('output/playwright')

test.beforeEach(async ({ page }) => {
  await resetBrowserDeckState(page)
})

test('loads the default deck and filters search results', async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto('/')

  await expect(page).toHaveTitle(/Link Deck/)
  await expect(page.getByRole('heading', { name: 'Link Deck' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open GitHub' })).toBeVisible()

  await page.getByRole('searchbox', { name: 'Search links' }).fill('notion')
  await expect(page.getByRole('link', { name: 'Open Notion' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open GitHub' })).toBeHidden()

  await page.getByRole('searchbox', { name: 'Search links' }).fill('does-not-exist')
  await expect(page.getByRole('heading', { name: 'No matching links' })).toBeVisible()

  expect(errors).toEqual([])
})

test('opens settings from the toolbar and switches to the shortcuts tab', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
  await page.getByRole('button', { name: 'Shortcuts' }).click()

  await expect(page.getByText('New link')).toBeVisible()
  await expect(page.getByText('Edit selected link')).toBeVisible()
  await expect(page.getByText('Ctrl + Shift + E')).toBeVisible()
  await expect(page.getByText('Ctrl + Shift + O')).toBeVisible()
})

test('creates a link from the toolbar and finds it with search', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Add link' }).click()
  await expect(page.getByRole('dialog', { name: 'Add link' })).toBeVisible()

  await page.getByLabel('Link URL').fill('https://example.com/link-deck-e2e')
  await page.getByLabel('Title').fill('E2E Link')
  await page.getByLabel('Notes').fill('Created by Playwright')
  await page.getByRole('button', { name: 'Save link' }).click()

  await expect(page.getByRole('dialog', { name: 'Add link' })).toBeHidden()
  await page.getByRole('searchbox', { name: 'Search links' }).fill('E2E Link')

  await expect(page.getByRole('link', { name: 'Open E2E Link' })).toBeVisible()
  await expect(page.getByText('Created by Playwright')).toBeVisible()
})

test('captures desktop and mobile smoke screenshots', async ({ page }) => {
  await mkdir(screenshotDir, { recursive: true })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Link Deck' })).toBeVisible()
  await page.screenshot({ path: path.join(screenshotDir, 'home-desktop.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Link Deck' })).toBeVisible()
  await page.screenshot({ path: path.join(screenshotDir, 'home-mobile.png'), fullPage: true })
})

async function resetBrowserDeckState(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.clear()

    const browserIndexedDb = window.indexedDB
    const databases: Array<{ name?: string }> =
      typeof browserIndexedDb.databases === 'function' ? await browserIndexedDb.databases() : [{ name: 'link-deck' }]

    await Promise.all(
      databases
        .map(database => database.name)
        .filter((name): name is string => Boolean(name))
        .map(
          name =>
            new Promise<void>((resolve, reject) => {
              const request = browserIndexedDb.deleteDatabase(name)

              request.onsuccess = () => resolve()
              request.onerror = () => reject(request.error)
              request.onblocked = () => resolve()
            }),
        ),
    )
  })
}
