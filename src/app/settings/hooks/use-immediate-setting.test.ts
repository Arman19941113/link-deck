import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vite-plus/test'

import { useImmediateSetting } from './use-immediate-setting'

it('keeps an immediate selection until the committed setting changes', () => {
  const onChange = vi.fn<(value: string) => void>()
  const { result, rerender } = renderHook(value => useImmediateSetting(value, onChange), { initialProps: 'normal' })

  act(() => result.current[1]('compact'))
  expect(onChange).toHaveBeenCalledWith('compact')
  expect(result.current[0]).toBe('compact')

  rerender('normal')
  expect(result.current[0]).toBe('compact')

  rerender('large')
  expect(result.current[0]).toBe('large')
})
