// Verifies home focus restoration behavior around modal open and close.

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vite-plus/test'

import { useHomeFocusRestore } from './use-home-focus-restore'
import { LINK_CARD_ID_ATTRIBUTE } from '@/app/deck/components/link-card'

describe('useHomeFocusRestore', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('restores focus to the search box after a dialog closes', async () => {
    const searchInput = appendSearchInput()
    const { result } = renderHook(() => useHomeFocusRestore())

    searchInput.focus()
    act(() => {
      result.current.rememberCurrentHomeFocus()
    })
    searchInput.blur()
    await restoreAfterClose(result.current.restoreHomeFocusAfterDialogClose)

    expect(searchInput).toHaveFocus()
  })

  it('restores focus to the previously focused link card after a dialog closes', async () => {
    appendSearchInput()
    const firstLinkCard = appendLinkCard('github')
    const { result } = renderHook(() => useHomeFocusRestore())

    firstLinkCard.focus()
    act(() => {
      result.current.rememberCurrentHomeFocus()
    })
    firstLinkCard.blur()
    await restoreAfterClose(result.current.restoreHomeFocusAfterDialogClose)

    expect(firstLinkCard).toHaveFocus()
  })

  it('focuses the saved new link card instead of the original target', async () => {
    const searchInput = appendSearchInput()
    const newLinkCard = appendLinkCard('new-link')
    const { result } = renderHook(() => useHomeFocusRestore())

    searchInput.focus()
    act(() => {
      result.current.rememberCurrentHomeFocus()
      result.current.requestNewLinkFocus('new-link')
    })
    searchInput.blur()
    await restoreAfterClose(result.current.restoreHomeFocusAfterDialogClose)

    expect(newLinkCard).toHaveFocus()
  })

  it('uses interaction focus when a toolbar button receives focus before opening a dialog', async () => {
    const searchInput = appendSearchInput()
    const toolbarButton = appendToolbarButton()
    const { result } = renderHook(() => useHomeFocusRestore())

    searchInput.focus()
    act(() => {
      result.current.rememberInteractionHomeFocus()
    })
    toolbarButton.focus()
    act(() => {
      result.current.rememberCurrentHomeFocus()
    })
    await restoreAfterClose(result.current.restoreHomeFocusAfterDialogClose)

    expect(searchInput).toHaveFocus()
  })

  it('falls back to the search box when the remembered link card no longer exists', async () => {
    const searchInput = appendSearchInput()
    const removedLinkCard = appendLinkCard('removed-link')
    const { result } = renderHook(() => useHomeFocusRestore())

    removedLinkCard.focus()
    act(() => {
      result.current.rememberCurrentHomeFocus()
    })
    removedLinkCard.remove()
    await restoreAfterClose(result.current.restoreHomeFocusAfterDialogClose)

    expect(searchInput).toHaveFocus()
  })
})

function appendSearchInput(): HTMLInputElement {
  const searchInput = document.createElement('input')

  searchInput.id = 'link-search'
  document.body.append(searchInput)

  return searchInput
}

function appendLinkCard(linkId: string): HTMLAnchorElement {
  const linkCard = document.createElement('a')

  linkCard.href = '#'
  linkCard.dataset.linkCardAction = 'true'
  linkCard.setAttribute(LINK_CARD_ID_ATTRIBUTE, linkId)
  document.body.append(linkCard)

  return linkCard
}

function appendToolbarButton(): HTMLButtonElement {
  const button = document.createElement('button')

  document.body.append(button)

  return button
}

async function restoreAfterClose(restore: () => void): Promise<void> {
  act(() => {
    restore()
  })

  await act(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  })
}
