// Provides typed access to the locally bundled built-in icon data.

import builtinIconsData from './assets/builtin-icons.json'

type BuiltinIconDataSource = 'material-icon-theme' | 'simple-icons' | 'logos' | 'fa6-brands' | 'devicon' | 'custom'

export type BuiltinIconData = {
  key: string
  source: BuiltinIconDataSource
  sourceLabel: string
  name: string
  title: string
  /** Curated 0-100 familiarity score for ranking built-in icon suggestions. */
  popularityScore: number
  color: string
  body: string
  width: number
  height: number
}

/** Keep the JSON data ordered by title with `node scripts/sort-builtin-icons.mjs`. */
export const BUILTIN_ICONS_DATA = builtinIconsData as readonly BuiltinIconData[]
