import { test, expect } from '@playwright/test'

const cardTitles = ['cal-title', 'email-title', 'news-title', 'weather-title', 'links-title']

function card(page, labelledBy) {
  return page.locator(`section[aria-labelledby="${labelledBy}"]`)
}

async function waitForDashboardReady(page) {
  await expect(page.getByTestId('dashboard-grid')).toBeVisible()
  await expect(card(page, 'cal-title')).toBeVisible()
  await expect(card(page, 'email-title')).toBeVisible()
  await expect(card(page, 'news-title')).toBeVisible()
  await expect(card(page, 'weather-title')).toBeVisible()
  await expect(card(page, 'links-title')).toBeVisible()
}

async function prepareVisualCapture(page) {
  await page.addStyleTag({
    content: 'section > div.p-5 { height: 160px !important; min-height: 160px !important; overflow: hidden !important; visibility: hidden !important; }',
  })
}

test.describe('dashboard regression checks', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test.beforeEach(async ({ page }) => {
    const consoleErrors = []
    const failedRequests = []

    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', error => consoleErrors.push(error.message))
    page.on('requestfailed', request => {
      if (new URL(request.url()).origin === new URL(page.url()).origin || ['document', 'script', 'stylesheet', 'font'].includes(request.resourceType())) {
        failedRequests.push(`${request.method()} ${request.url()} (${request.failure()?.errorText || 'request failed'})`)
      }
    })
    page.on('response', response => {
      const request = response.request()
      const sameOrigin = new URL(response.url()).origin === new URL(page.url()).origin
      if (response.status() >= 400 && (sameOrigin || ['document', 'script', 'stylesheet', 'font'].includes(request.resourceType()))) {
        failedRequests.push(`${request.method()} ${response.url()} (${response.status()})`)
      }
    })

    await page.goto('.', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts?.ready)
    await waitForDashboardReady(page)

    await expect(page).toHaveTitle(/Command Centre/)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('aside').first()).toBeVisible()
    for (const title of cardTitles) await expect(card(page, title)).toBeVisible()

    expect(consoleErrors, `JavaScript errors: ${consoleErrors.join('\n')}`).toEqual([])
    expect(failedRequests, `Critical network failures: ${failedRequests.join('\n')}`).toEqual([])
  })

  test('keeps dashboard cards aligned and within the available width', async ({ page }) => {
    const layout = await page.getByTestId('dashboard-grid').evaluate(element => {
      const rect = element.getBoundingClientRect()
      const cards = [...element.querySelectorAll(':scope > div > section')].map(cardElement => {
        const cardRect = cardElement.getBoundingClientRect()
        return { left: cardRect.left, right: cardRect.right, top: cardRect.top, bottom: cardRect.bottom, width: cardRect.width }
      })
      const style = getComputedStyle(element)
      return { rect: { left: rect.left, right: rect.right, width: rect.width }, cards, columnCount: style.columnCount }
    })

    const mainRect = await page.locator('main').boundingBox()
    expect(layout.rect.width).toBeGreaterThan(mainRect.width * 0.85)
    expect(layout.rect.right).toBeLessThanOrEqual(mainRect.x + mainRect.width + 1)
    expect(Number(layout.columnCount)).toBe(3)

    for (const current of layout.cards) {
      expect(current.width).toBeGreaterThan(250)
      expect(current.right).toBeLessThanOrEqual(layout.rect.right + 1)
      expect(current.left).toBeGreaterThanOrEqual(layout.rect.left - 1)
      for (const next of layout.cards) {
        const overlaps = current.left < next.right && current.right > next.left && current.top < next.bottom && current.bottom > next.top
        if (current !== next) expect(overlaps).toBe(false)
      }
    }
  })

  test('matches the desktop dashboard visual baseline', async ({ page }) => {
    await prepareVisualCapture(page)
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      mask: [page.locator('header').first()],
      maxDiffPixelRatio: 0.01,
    })
  })
})

test('matches the laptop dashboard visual baseline', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('.', { waitUntil: 'domcontentloaded' })
  await waitForDashboardReady(page)
  await prepareVisualCapture(page)
  await expect(page).toHaveScreenshot('dashboard-laptop.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    mask: [page.locator('header').first()],
    maxDiffPixelRatio: 0.01,
  })
})