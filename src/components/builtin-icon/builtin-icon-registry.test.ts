// Verifies built-in icon matching and ranking rules.

import { describe, expect, it } from 'vite-plus/test'

import { findBuiltinIconByNameKeywords, searchBuiltinIcons } from './builtin-icon-registry'

describe('searchBuiltinIcons', () => {
  it.each(['豆包', 'Doubao'])('finds Doubao when searching for %s', query => {
    expect(searchBuiltinIcons(query)).toEqual([expect.objectContaining({ key: 'custom:doubao' })])
  })
})

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

  it.each(['chatgp', 'definitelymissing'])('returns null when no icon name or exact alias matches %s', keyword => {
    expect(findBuiltinIconByNameKeywords([keyword])).toBeNull()
  })
})
