import { readFile, writeFile } from 'node:fs/promises'

const builtinIconsPath = new URL('../src/components/builtin-icon/assets/builtin-icons.json', import.meta.url)
const expectedIconCount = 180
const titleCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

const icons = JSON.parse(await readFile(builtinIconsPath, 'utf8'))

validateIcons(icons)
icons.sort(compareIcons)

await writeFile(builtinIconsPath, `${JSON.stringify(icons, null, 2)}\n`)
console.log(`Sorted ${icons.length} built-in icons by title.`)

function validateIcons(value) {
  if (!Array.isArray(value)) {
    throw new TypeError('Built-in icon data must be an array')
  }

  if (value.length !== expectedIconCount) {
    throw new Error(`Expected ${expectedIconCount} built-in icons, received ${value.length}`)
  }

  const keys = new Set()

  for (const icon of value) {
    if (!icon || typeof icon !== 'object' || typeof icon.key !== 'string' || typeof icon.title !== 'string') {
      throw new TypeError('Each built-in icon must have string key and title fields')
    }

    if (keys.has(icon.key)) {
      throw new Error(`Duplicate built-in icon key: ${icon.key}`)
    }

    keys.add(icon.key)
  }
}

function compareIcons(left, right) {
  return titleCollator.compare(left.title, right.title) || left.key.localeCompare(right.key, 'en')
}
