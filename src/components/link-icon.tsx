// Link icon with automatic favicon, external URL, and local file Blob support.

import { useEffect, useState } from 'react'
import { Link as LinkIconGlyph } from 'lucide-react'

import { isGenericLinkBuiltinIcon, loadBuiltinIcon } from '@/domain/brand-icons'
import type { IconFile, Link } from '@/domain/types'
import { getFaviconUrl } from '@/domain/url'
import { cn } from '@/lib/utils'

const AUTO_ICON_TIMEOUT_MS = 3000

type LinkIconProps = {
  link: Link
  getIconFile: (id: string) => Promise<IconFile | undefined>
  imageClassName?: string
  wrapperClassName?: string
}

/** Extracts initials from the link name for icon fallback display. */
function getFallbackLetter(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase() || '?'
}

/** Loads images from link icon settings and shows a text placeholder on failure. */
export function LinkIcon({ link, getIconFile, imageClassName, wrapperClassName }: LinkIconProps) {
  const [localIcon, setLocalIcon] = useState<{ fileId: string; url: string } | null>(null)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null)
  const icon = link.icon
  const imageUrl =
    icon.type === 'file'
      ? localIcon?.fileId === icon.fileId
        ? localIcon.url
        : null
      : icon.type === 'url'
        ? icon.url
        : icon.type === 'builtin'
          ? null
          : getFaviconUrl(link.url)

  useEffect(() => {
    let canceled = false
    let objectUrl: string | null = null

    if (icon.type !== 'file') {
      return undefined
    }

    void getIconFile(icon.fileId)
      .then(iconFile => {
        if (canceled || !iconFile) {
          return
        }

        objectUrl = URL.createObjectURL(iconFile.blob)
        setLocalIcon({ fileId: icon.fileId, url: objectUrl })
      })
      .catch(() => undefined)

    return () => {
      canceled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [getIconFile, icon])

  useEffect(() => {
    if (icon.type !== 'auto' || !imageUrl || loadedImageUrl === imageUrl) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setFailedImageUrl(imageUrl)
    }, AUTO_ICON_TIMEOUT_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [icon.type, imageUrl, loadedImageUrl])

  if (icon.type === 'builtin') {
    if (isGenericLinkBuiltinIcon(icon.slug)) {
      return (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center border bg-secondary',
            wrapperClassName ?? 'size-11 rounded-md text-sm',
          )}
        >
          <LinkIconGlyph
            role="img"
            aria-label={icon.title}
            className={cn('object-contain', imageClassName ?? 'size-7 rounded-sm')}
            style={{ color: `#${icon.hex}` }}
          />
        </span>
      )
    }

    const loadedBuiltinIcon = loadBuiltinIcon(icon.slug)

    if (!loadedBuiltinIcon) {
      return (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center border bg-secondary font-medium text-secondary-foreground',
            wrapperClassName ?? 'size-11 rounded-md text-sm',
          )}
          aria-hidden="true"
        >
          {getFallbackLetter(link.name)}
        </span>
      )
    }

    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center border bg-secondary',
          wrapperClassName ?? 'size-11 rounded-md text-sm',
        )}
      >
        <svg
          viewBox={`0 0 ${loadedBuiltinIcon.width} ${loadedBuiltinIcon.height}`}
          role="img"
          aria-label={loadedBuiltinIcon.title}
          className={cn('object-contain', imageClassName ?? 'size-7 rounded-sm')}
          style={{ color: `#${loadedBuiltinIcon.color}` }}
          dangerouslySetInnerHTML={{ __html: loadedBuiltinIcon.body }}
        />
      </span>
    )
  }

  const imageFailed = imageUrl ? failedImageUrl === imageUrl : false

  if (!imageUrl || imageFailed) {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center border bg-secondary font-medium text-secondary-foreground',
          wrapperClassName ?? 'size-11 rounded-md text-sm',
        )}
        aria-hidden="true"
      >
        {getFallbackLetter(link.name)}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center border bg-secondary',
        wrapperClassName ?? 'size-11 rounded-md text-sm',
      )}
    >
      <img
        src={imageUrl}
        alt=""
        className={cn('object-contain', imageClassName ?? 'size-7 rounded-sm')}
        loading="lazy"
        onLoad={() => setLoadedImageUrl(imageUrl)}
        onError={() => setFailedImageUrl(imageUrl)}
      />
    </span>
  )
}
