// Verifies built-in icon matching and ranking rules.

import { describe, expect, it } from 'vite-plus/test'

import { findBuiltinIconByNameKeywords } from './builtin-icon-registry'

describe('findBuiltinIconByNameKeywords', () => {
  it('prefers an exact name match over a higher-priority containing match', () => {
    expect(findBuiltinIconByNameKeywords(['bun'])).toMatchObject({
      type: 'builtin',
      slug: 'simple-icons:bun',
      title: 'Bun',
    })
  })

  it('uses popularity to rank containing matches', () => {
    expect(findBuiltinIconByNameKeywords(['goog'])).toEqual({
      type: 'builtin',
      slug: 'material-icon-theme:google',
      title: 'Google',
      hex: '000000',
    })
  })

  it('prefers an icon matching both subdomain and registrable domain keywords', () => {
    expect(findBuiltinIconByNameKeywords(['gemini', 'google'])).toEqual({
      type: 'builtin',
      slug: 'simple-icons:googlegemini',
      title: 'Gemini',
      hex: '3186FF',
    })
  })

  it('prefers an exact registrable domain match when candidates match the same number of keywords', () => {
    expect(findBuiltinIconByNameKeywords(['app', 'google'])).toMatchObject({
      slug: 'material-icon-theme:google',
      title: 'Google',
    })
  })

  it('returns null when no icon name contains the keyword', () => {
    expect(findBuiltinIconByNameKeywords(['definitelymissing'])).toBeNull()
  })
})
