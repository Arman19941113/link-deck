// Bridges Testing Library Jest-DOM matcher types to Vite+ test imports.

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vite-plus/test' {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<unknown, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, unknown> {}
}
