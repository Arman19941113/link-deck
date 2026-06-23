// Captures the README preview screenshots in English and Chinese.

import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium, expect } from '@playwright/test'

const defaultPort = 4173
const defaultWidth = 1280
const defaultHeight = 680
const defaultDeviceScaleFactor = 2
const outputDir = path.resolve('public/preview')
const captures = [
  { filename: 'link-deck-home-en.png', headingName: 'Link Deck', language: 'en' },
  { filename: 'link-deck-home-zh.png', headingName: 'Link Deck', language: 'zh' },
]

const options = parseOptions(process.argv.slice(2))
const width = readPositiveIntegerOption(options.width, defaultWidth, 'width')
const height = readPositiveIntegerOption(options.height, defaultHeight, 'height')
const deviceScaleFactor = readPositiveIntegerOption(options.dpr, defaultDeviceScaleFactor, 'dpr')
const port = readPositiveIntegerOption(options.port, defaultPort, 'port')
const appUrl = options.url ?? `http://127.0.0.1:${port}/`

await mkdir(outputDir, { recursive: true })

const startedServer = options.url ? null : await startDevServer(port)

try {
  const results = []

  for (const capture of captures) {
    results.push(await capturePreview(capture))
  }

  for (const result of results) {
    console.log(`${result.path} ${result.pixelWidth}x${result.pixelHeight}`)
  }
} finally {
  if (startedServer) {
    await stopDevServer(startedServer)
  }
}

async function capturePreview({ filename, headingName, language }) {
  const browser = await chromium.launch()

  try {
    const context = await browser.newContext({
      deviceScaleFactor,
      viewport: { width, height },
    })
    const page = await context.newPage()

    await resetPageStorage(page)
    await page.evaluate(nextLanguage => {
      localStorage.setItem('link-deck.language', JSON.stringify(nextLanguage))
    }, language)
    await page.goto(appUrl, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: headingName })).toBeVisible()

    const screenshotPath = path.join(outputDir, filename)

    await page.screenshot({ fullPage: false, path: screenshotPath })

    const metrics = await page.evaluate(() => ({
      cssHeight: window.innerHeight,
      cssWidth: window.innerWidth,
      dpr: window.devicePixelRatio,
    }))

    assertMetric(metrics.cssWidth, width, 'CSS width')
    assertMetric(metrics.cssHeight, height, 'CSS height')
    assertMetric(metrics.dpr, deviceScaleFactor, 'device scale factor')

    return {
      path: screenshotPath,
      pixelHeight: height * deviceScaleFactor,
      pixelWidth: width * deviceScaleFactor,
    }
  } finally {
    await browser.close()
  }
}

async function resetPageStorage(page) {
  await page.goto(appUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(async () => {
    localStorage.clear()

    const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [{ name: 'link-deck' }]

    await Promise.all(
      databases
        .map(database => database.name)
        .filter(Boolean)
        .map(
          name =>
            new Promise(resolve => {
              const request = indexedDB.deleteDatabase(name)

              request.onsuccess = () => resolve()
              request.onerror = () => resolve()
              request.onblocked = () => resolve()
            }),
        ),
    )
  })
}

async function startDevServer(port) {
  const server = spawn('pnpm', ['dev', '--host', '127.0.0.1', '--port', String(port)], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let output = ''

  server.stdout.on('data', chunk => {
    output += chunk.toString()
  })
  server.stderr.on('data', chunk => {
    output += chunk.toString()
  })

  await waitForServer(appUrl, 30000, () => output)

  return server
}

async function stopDevServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) {
    return
  }

  const exited = new Promise(resolve => {
    server.once('exit', resolve)
  })

  try {
    process.kill(-server.pid, 'SIGINT')
  } catch {
    server.kill('SIGINT')
  }

  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 5000))])

  if (server.exitCode === null && server.signalCode === null) {
    try {
      process.kill(-server.pid, 'SIGTERM')
    } catch {
      server.kill('SIGTERM')
    }
  }
}

async function waitForServer(url, timeoutMs, readOutput) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)

      if (response.ok) {
        return
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }

  throw new Error(`Timed out waiting for ${url}\n${readOutput()}`)
}

function parseOptions(args) {
  const parsedOptions = {}

  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.+)$/)

    if (!match) {
      throw new Error(`Unsupported option: ${arg}. Use --width=1280 --height=680 --dpr=2.`)
    }

    parsedOptions[match[1]] = match[2]
  }

  return parsedOptions
}

function readPositiveIntegerOption(value, fallback, name) {
  if (value === undefined) {
    return fallback
  }

  const numericValue = Number(value)

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new Error(`Expected --${name} to be a positive integer.`)
  }

  return numericValue
}

function assertMetric(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`Expected ${label} to be ${expected}, received ${actual}.`)
  }
}
