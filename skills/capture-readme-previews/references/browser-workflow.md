# Built-In Browser Workflow

Use this reference only after the built-in browser skill has been loaded and `mcp__node_repl.js` is available.

## Browser Setup

Run the required browser bootstrap first. Use the `browser:control-in-app-browser` skill's current plugin root when importing `scripts/browser-client.mjs`; do not hardcode a user-specific plugin cache path.

```js
if (globalThis.agent?.browsers == null) {
  const { setupBrowserRuntime } = await import('<browser-plugin-root>/scripts/browser-client.mjs')
  await setupBrowserRuntime({ globals: globalThis })
}
globalThis.browser = await agent.browsers.get('iab')
nodeRepl.write(await browser.documentation())
```

Then run the capture workflow below. It intentionally selects Normal display size through the settings UI instead of writing the display-size key directly.

```js
if (typeof tab === 'undefined') {
  globalThis.tab = await browser.tabs.new()
}

var fs = await import('node:fs/promises')
var path = await import('node:path')
var viewport = await browser.capabilities.get('viewport')
await viewport.set({ width: 1200, height: 800 })

var repoRoot = nodeRepl.cwd
var appUrl = 'http://127.0.0.1:4173/'
var outputDir = path.join(repoRoot, 'public/preview')
var captures = [
  { filename: 'link-deck-home-en.png', language: 'en', settingsName: 'Open settings', closeName: 'Close' },
  { filename: 'link-deck-home-zh.png', language: 'zh', settingsName: '打开设置', closeName: '关闭' },
]

async function getCdp() {
  return await tab.capabilities.get('cdp')
}

async function applyDeviceMetrics(cdp) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 800,
    deviceScaleFactor: 2,
    mobile: false,
    screenWidth: 1200,
    screenHeight: 800,
  })
}

async function resetDataForLanguage(language) {
  const cdp = await getCdp()
  await tab.goto(appUrl)
  await tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 30000 })
  await applyDeviceMetrics(cdp)
  await cdp.send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      (async () => {
        localStorage.clear();
        const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [{ name: 'link-deck' }];
        await Promise.all(databases
          .map(database => database.name)
          .filter(Boolean)
          .map(name => new Promise(resolve => {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
          })));
        localStorage.setItem('link-deck.language', JSON.stringify(${JSON.stringify(language)}));
      })()
    `,
  })
  await tab.goto(appUrl)
  await tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 30000 })
  await applyDeviceMetrics(cdp)
  return cdp
}

async function setNormalSizeViaSettings(capture) {
  await tab.playwright
    .getByRole('heading', { name: 'Link Deck', exact: true })
    .waitFor({ state: 'visible', timeoutMs: 30000 })

  const settingsButton = tab.playwright.getByRole('button', { name: capture.settingsName, exact: true })
  const settingsCount = await settingsButton.count()
  if (settingsCount !== 1) {
    throw new Error(`Expected one settings button for ${capture.settingsName}, found ${settingsCount}`)
  }
  await settingsButton.click({})

  const dialog = tab.playwright.getByRole('dialog', {
    name: capture.language === 'zh' ? '设置' : 'Settings',
    exact: true,
  })
  await dialog.waitFor({ state: 'visible', timeoutMs: 30000 })

  const normalLabel = tab.playwright.locator('label:has(input[name="display-size"][value="normal"])')
  const normalCount = await normalLabel.count()
  if (normalCount !== 1) {
    throw new Error(`Expected one normal display-size label, found ${normalCount}`)
  }
  await normalLabel.click({})

  await tab.playwright.waitForTimeout(300)
  const closeButton = dialog.getByRole('button', { name: capture.closeName, exact: true })
  const closeCount = await closeButton.count()
  if (closeCount !== 1) {
    throw new Error(`Expected one close button for ${capture.closeName}, found ${closeCount}`)
  }
  await closeButton.click({})
  await dialog.waitFor({ state: 'hidden', timeoutMs: 30000 })
}

var results = []
for (const capture of captures) {
  const cdp = await resetDataForLanguage(capture.language)
  await setNormalSizeViaSettings(capture)
  await applyDeviceMetrics(cdp)
  await tab.playwright.waitForTimeout(800)

  const metrics = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `({
      cssWidth: window.innerWidth,
      cssHeight: window.innerHeight,
      dpr: window.devicePixelRatio,
      languageValue: localStorage.getItem('link-deck.language'),
      displaySizeValue: localStorage.getItem('link-deck.display-size'),
      firstCardHeight: Math.round(document.querySelector('[data-link-card-id]')?.getBoundingClientRect().height ?? 0)
    })`,
  })

  if (metrics.result?.value?.displaySizeValue !== '"normal"') {
    throw new Error(`Display size was not normal before ${capture.filename}: ${JSON.stringify(metrics.result?.value)}`)
  }

  const screenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  const bytes = Buffer.from(screenshot.data, 'base64')
  const screenshotPath = path.join(outputDir, capture.filename)
  await fs.writeFile(screenshotPath, bytes)
  results.push({ path: screenshotPath, byteLength: bytes.length, metrics: metrics.result?.value })
}

await viewport.reset()
nodeRepl.write(JSON.stringify(results, null, 2))
```

## Validation

After capture, run:

```bash
sips -g pixelWidth -g pixelHeight public/preview/link-deck-home-en.png public/preview/link-deck-home-zh.png
git status --short
```

Expected PNG dimensions are `2400x1600`. The browser metrics should show `cssWidth: 1200`, `cssHeight: 800`, `dpr: 2`, and `displaySizeValue: "\"normal\""`.
