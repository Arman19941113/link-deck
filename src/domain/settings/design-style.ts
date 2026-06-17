// Defines app design style options and validation helpers.

export type DesignStylePreference = 'editorial' | 'prism'

export const DEFAULT_DESIGN_STYLE_PREFERENCE: DesignStylePreference = 'editorial'

export const DESIGN_STYLE_OPTIONS: Array<{
  value: DesignStylePreference
  label: string
  description: string
}> = [
  {
    value: 'editorial',
    label: 'Editorial',
    description: 'Warm editorial canvas with charcoal type and orange accents',
  },
  {
    value: 'prism',
    label: 'Prism',
    description: 'Crisp blue-green workspace with bright cards and soft icons',
  },
]

export const DESIGN_STYLE_ASSETS: Record<
  DesignStylePreference,
  {
    favicon: string
    logo: string
  }
> = {
  editorial: {
    favicon: 'brand/logo-editorial.svg',
    logo: 'brand/logo-editorial.svg',
  },
  prism: {
    favicon: 'brand/logo-prism.svg',
    logo: 'brand/logo-prism.svg',
  },
}

const DESIGN_STYLE_PREFERENCE_VALUES = new Set<DesignStylePreference>(DESIGN_STYLE_OPTIONS.map(option => option.value))

/** Checks unknown stored settings before using them as design style state. */
export function isDesignStylePreference(value: unknown): value is DesignStylePreference {
  return typeof value === 'string' && DESIGN_STYLE_PREFERENCE_VALUES.has(value as DesignStylePreference)
}
