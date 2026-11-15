import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vite-plus/test'

import { getDisplaySizeConfig } from '@/app/display-size-config'
import i18n from '@/i18n'
import { BuiltinIconField } from './builtin-icon-field'
import { DEFAULT_BUILTIN_ICON } from './builtin-icon-registry'

it('keeps the icon in use when a search no longer has matches', async () => {
  await i18n.changeLanguage('en')
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(
    <BuiltinIconField
      value={DEFAULT_BUILTIN_ICON}
      displaySizeConfig={getDisplaySizeConfig('normal')}
      onChange={onChange}
    />,
  )

  await user.click(screen.getByRole('button', { name: /Link/ }))
  const picker = within(screen.getByRole('dialog', { name: 'Choose built-in icon' }))
  const search = picker.getByRole('textbox', { name: 'Search built-in icons' })

  fireEvent.change(search, { target: { value: 'GitHub' } })
  expect(picker.queryByText('Link', { exact: true })).not.toBeInTheDocument()

  fireEvent.change(search, { target: { value: 'GitHub no match' } })
  expect(picker.getByText('No built-in icons match this search.')).toBeVisible()
  expect(picker.getByText('Link', { exact: true })).toBeVisible()

  await user.click(picker.getByRole('button', { name: 'Use icon' }))
  expect(onChange).toHaveBeenCalledExactlyOnceWith(DEFAULT_BUILTIN_ICON)
})
