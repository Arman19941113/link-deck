// Tracks and restores focus for the home search box and link cards across modal dialogs.

import { useCallback, useRef } from 'react'

import { LINK_CARD_ID_ATTRIBUTE, focusLinkCardById } from '@/app/deck/components/link-card'

const SEARCH_INPUT_ID = 'link-search'
const LINK_CARD_ACTION_SELECTOR = "[data-link-card-action='true']"
type HomeFocusTarget = { type: 'search' } | { type: 'link-card'; linkId: string }

/** Captures supported home focus targets and restores them after modal close transitions. */
export function useHomeFocusRestore() {
  const focusTargetRef = useRef<HomeFocusTarget | null>(null)
  const interactionFocusCaptureRef = useRef<HomeFocusTarget | null>(null)
  const pendingNewLinkFocusIdRef = useRef<string | null>(null)

  const consumeRecentInteractionFocusCapture = useCallback((): HomeFocusTarget | null => {
    const capture = interactionFocusCaptureRef.current

    interactionFocusCaptureRef.current = null

    return capture
  }, [])

  const rememberCurrentHomeFocus = useCallback(() => {
    focusTargetRef.current =
      getHomeFocusTarget(document.activeElement) ?? consumeRecentInteractionFocusCapture() ?? focusTargetRef.current
  }, [consumeRecentInteractionFocusCapture])

  const rememberInteractionHomeFocus = useCallback(() => {
    const focusTarget = getHomeFocusTarget(document.activeElement)

    interactionFocusCaptureRef.current = focusTarget

    if (focusTarget) {
      focusTargetRef.current = focusTarget
    }
  }, [])

  const requestNewLinkFocus = useCallback((linkId: string) => {
    pendingNewLinkFocusIdRef.current = linkId
  }, [])

  const restoreHomeFocusAfterDialogClose = useCallback(() => {
    const pendingNewLinkFocusId = pendingNewLinkFocusIdRef.current

    pendingNewLinkFocusIdRef.current = null

    requestAnimationFrame(() => {
      if (pendingNewLinkFocusId && focusLinkCardById(pendingNewLinkFocusId)) {
        focusTargetRef.current = null
        return
      }

      restoreHomeFocus(focusTargetRef.current)
      focusTargetRef.current = null
    })
  }, [])

  return {
    rememberCurrentHomeFocus,
    rememberInteractionHomeFocus,
    requestNewLinkFocus,
    restoreHomeFocusAfterDialogClose,
  }
}

function getHomeFocusTarget(activeElement: Element | null): HomeFocusTarget | null {
  if (activeElement instanceof HTMLInputElement && activeElement.id === SEARCH_INPUT_ID) {
    return { type: 'search' }
  }

  const linkCardAction =
    activeElement instanceof HTMLElement ? activeElement.closest<HTMLElement>(LINK_CARD_ACTION_SELECTOR) : null
  const linkId = linkCardAction?.getAttribute(LINK_CARD_ID_ATTRIBUTE)

  return linkId ? { type: 'link-card', linkId } : null
}

function restoreHomeFocus(target: HomeFocusTarget | null): void {
  if (!target) {
    return
  }

  if (target.type === 'search') {
    document.getElementById(SEARCH_INPUT_ID)?.focus({ preventScroll: true })
    return
  }

  if (!focusLinkCardById(target.linkId)) {
    document.getElementById(SEARCH_INPUT_ID)?.focus({ preventScroll: true })
  }
}
