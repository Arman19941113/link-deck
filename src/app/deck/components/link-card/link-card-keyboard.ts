// Shared DOM helpers for link-card keyboard focus management.

const LINK_CARD_ACTION_SELECTOR = "[data-link-card-action='true']"

export const LINK_CARD_ID_ATTRIBUTE = 'data-link-card-id'

type LinkCardGeometry = {
  element: HTMLElement
  rect: DOMRect
  centerX: number
  centerY: number
}

/** Focuses the first visible link card. */
export function focusFirstLinkCard(): boolean {
  return focusLinkCardAtIndex(0)
}

/** Moves focus between visible link cards, optionally wrapping at the ends. */
export function focusSiblingLinkCard(currentTarget: HTMLElement, direction: 1 | -1, wrap = false): void {
  const cards = getFocusableLinkCards()
  const currentIndex = cards.indexOf(currentTarget)

  if (currentIndex < 0 || cards.length === 0) {
    return
  }

  const nextIndex = wrap
    ? (currentIndex + direction + cards.length) % cards.length
    : Math.min(Math.max(currentIndex + direction, 0), cards.length - 1)

  cards[nextIndex]?.focus()
}

/** Captures the card that should receive focus after the current card is removed. */
export function createPostDeleteLinkCardFocus(currentTarget: HTMLElement): () => void {
  const cards = getFocusableLinkCards()
  const currentIndex = cards.indexOf(currentTarget)
  const fallbackCard = currentIndex >= 0 ? (cards[currentIndex + 1] ?? cards[currentIndex - 1] ?? null) : null
  const fallbackLinkId = fallbackCard?.getAttribute(LINK_CARD_ID_ATTRIBUTE) ?? null

  return () => {
    requestAnimationFrame(() => {
      const card = fallbackLinkId
        ? document.querySelector<HTMLElement>(`[${LINK_CARD_ID_ATTRIBUTE}="${CSS.escape(fallbackLinkId)}"]`)
        : null

      card?.focus({ preventScroll: true })
    })
  }
}

/** Moves focus to the nearest visually aligned link card above or below the current one. */
export function focusVerticalLinkCard(currentTarget: HTMLElement, direction: 1 | -1): void {
  const currentRect = currentTarget.getBoundingClientRect()
  const currentCenterX = getRectCenterX(currentRect)
  const currentCenterY = getRectCenterY(currentRect)
  const candidates = getFocusableLinkCards()
    .filter(card => card !== currentTarget)
    .map(element => {
      const rect = element.getBoundingClientRect()

      return {
        element,
        rect,
        centerX: getRectCenterX(rect),
        centerY: getRectCenterY(rect),
      }
    })
    .filter(candidate =>
      direction > 0 ? candidate.centerY > currentCenterY + 1 : candidate.centerY < currentCenterY - 1,
    )

  const nextCard = candidates.toSorted((left, right) => {
    const leftScore = getVerticalFocusScore(currentRect, currentCenterX, currentCenterY, left)
    const rightScore = getVerticalFocusScore(currentRect, currentCenterX, currentCenterY, right)

    return leftScore - rightScore
  })[0]?.element

  nextCard?.focus()
}

/** Returns the currently rendered link cards in document tab order. */
function getFocusableLinkCards(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(LINK_CARD_ACTION_SELECTOR))
}

function focusLinkCardAtIndex(index: number): boolean {
  const cards = getFocusableLinkCards()
  const card = cards[index]

  if (!card) {
    return false
  }

  card.focus()
  return true
}

function getRectCenterX(rect: DOMRect): number {
  return rect.left + rect.width / 2
}

function getRectCenterY(rect: DOMRect): number {
  return rect.top + rect.height / 2
}

function getHorizontalOverlap(left: DOMRect, right: DOMRect): number {
  return Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
}

function getVerticalFocusScore(
  currentRect: DOMRect,
  currentCenterX: number,
  currentCenterY: number,
  candidate: LinkCardGeometry,
): number {
  const verticalDistance = Math.abs(candidate.centerY - currentCenterY)
  const horizontalDistance = Math.abs(candidate.centerX - currentCenterX)
  const overlapPenalty = getHorizontalOverlap(currentRect, candidate.rect) > 0 ? 0 : currentRect.width

  return verticalDistance * 1000 + horizontalDistance + overlapPenalty
}
