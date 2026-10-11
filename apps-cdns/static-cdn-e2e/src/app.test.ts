import { expect, test } from '@vx/config/playwright/test'

test.describe('static-cdn', () => {
  test('loads the application document', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('.vx-app')).toBeVisible()
  })

  test('loads an unmatched route', async ({ page }) => {
    await page.goto('/hello-world')

    await expect(page.locator('[data-vx-not-found-path]')).toHaveText(
      ': /hello-world'
    )
  })
})
