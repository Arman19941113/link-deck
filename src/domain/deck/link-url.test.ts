// Verifies link URL normalization and domain keyword extraction.

import { describe, expect, it } from 'vite-plus/test'

import { getLinkDomainKeywords } from './link-url'

describe('getLinkDomainKeywords', () => {
  it.each([
    ['https://www.google.com/search', ['google']],
    ['https://gemini.google.com', ['gemini', 'google']],
    ['https://api.docs.github.co.uk', ['api', 'docs', 'github']],
    ['https://www.google.com.cn', ['google']],
  ])('extracts domain labels from %s', (url, expectedKeywords) => {
    expect(getLinkDomainKeywords(url)).toEqual(expectedKeywords)
  })

  it.each(['', 'not a url', 'ftp://google.com', 'http://127.0.0.1', 'http://localhost:3000'])(
    'returns null for %s',
    url => {
      expect(getLinkDomainKeywords(url)).toEqual([])
    },
  )
})
