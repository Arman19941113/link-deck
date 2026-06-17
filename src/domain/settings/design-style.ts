// Defines app design style options and validation helpers.

export type DesignStylePreference = 'paper' | 'slate' | 'cobalt'

export const DEFAULT_DESIGN_STYLE_PREFERENCE: DesignStylePreference = 'paper'

export const DESIGN_STYLE_OPTIONS: Array<{
  value: DesignStylePreference
  label: string
  description: string
}> = [
  {
    value: 'paper',
    label: 'Paper',
    description: 'Warm paper canvas with charcoal type and orange accents',
  },
  {
    value: 'slate',
    label: 'Slate',
    description: 'Calm grayscale workspace with bright cards and crisp contrast',
  },
  {
    value: 'cobalt',
    label: 'Cobalt',
    description: 'Crisp white workspace with balanced cobalt actions and calm blue surfaces',
  },
]

export const DESIGN_STYLE_ASSETS: Record<
  DesignStylePreference,
  {
    favicon: string
    logo: string
  }
> = {
  paper: {
    favicon: 'brand/logo-paper.svg',
    logo: 'brand/logo-paper.svg',
  },
  slate: {
    favicon: 'brand/logo-slate.svg',
    logo: 'brand/logo-slate.svg',
  },
  cobalt: {
    favicon: 'brand/logo-cobalt.svg',
    logo: 'brand/logo-cobalt.svg',
  },
}

const DESIGN_STYLE_PREFERENCE_VALUES = new Set<DesignStylePreference>(DESIGN_STYLE_OPTIONS.map(option => option.value))

/** Checks unknown stored settings before using them as design style state. */
export function isDesignStylePreference(value: unknown): value is DesignStylePreference {
  return typeof value === 'string' && DESIGN_STYLE_PREFERENCE_VALUES.has(value as DesignStylePreference)
}
