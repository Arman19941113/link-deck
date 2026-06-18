// Sets up shared DOM test behavior and browser API shims for Vitest.

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vite-plus/test'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.localStorage.clear()
})

const testWindow = window as Window & {
  PointerEvent?: typeof PointerEvent
  ResizeObserver?: typeof ResizeObserver
  matchMedia?: (query: string) => MediaQueryList
}

if (!testWindow.PointerEvent) {
  testWindow.PointerEvent = MouseEvent as typeof PointerEvent
}

if (!testWindow.ResizeObserver) {
  testWindow.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}

if (!testWindow.matchMedia) {
  testWindow.matchMedia = vi.fn().mockImplementation(
    (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  )
}
