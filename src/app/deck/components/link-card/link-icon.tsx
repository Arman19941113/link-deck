// Link icon with automatic favicon, external URL, and local file Blob support.

import { useEffect, useState } from 'react'

import type { StoredIconFile, SavedLink } from '@/domain/deck/types'
import { getAutoFaviconUrl } from '@/lib/url'
import { BuiltinIconPreview } from '@/components/builtin-icon/builtin-icon-preview'
import { getBuiltinIconMetadata, resolveBuiltinIconRenderModel } from '@/components/builtin-icon/builtin-icon-registry'
import { cn } from '@/lib/utils'

type LinkIconProps = {
  link: SavedLink
  loadStoredIconFile: (id: string) => Promise<StoredIconFile | undefined>
  imageClassName?: string
  wrapperClassName?: string
}

const AUTO_ICON_TIMEOUT_MS = 3000
const ICON_TILE_CLASS = 'app-icon-tile flex shrink-0 items-center justify-center border'
const ICON_FALLBACK_CLASS = 'app-icon-fallback font-medium'

/** Loads images from link icon settings and shows a text placeholder on failure. */
export function LinkCardIcon({ link, loadStoredIconFile, imageClassName, wrapperClassName }: LinkIconProps) {
  const [fileIconObjectUrl, setFileIconObjectUrl] = useState<{ fileId: string; url: string } | null>(null)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null)
  const icon = link.icon
  const resolvedImageUrl =
    icon.type === 'file'
      ? fileIconObjectUrl?.fileId === icon.fileId
        ? fileIconObjectUrl.url
        : null
      : icon.type === 'url'
        ? icon.url
        : icon.type === 'builtin'
          ? null
          : getAutoFaviconUrl(link.url)

  useEffect(() => {
    let canceled = false
    let objectUrl: string | null = null

    if (icon.type !== 'file') {
      return undefined
    }

    void loadStoredIconFile(icon.fileId)
      .then(iconFile => {
        if (canceled || !iconFile) {
          return
        }

        objectUrl = URL.createObjectURL(iconFile.blob)
        setFileIconObjectUrl({ fileId: icon.fileId, url: objectUrl })
      })
      .catch(() => undefined)

    return () => {
      canceled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [loadStoredIconFile, icon])

  useEffect(() => {
    if (icon.type !== 'auto' || !resolvedImageUrl || loadedImageUrl === resolvedImageUrl) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setFailedImageUrl(resolvedImageUrl)
    }, AUTO_ICON_TIMEOUT_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [icon.type, resolvedImageUrl, loadedImageUrl])

  if (icon.type === 'builtin') {
    const iconMetadata = getBuiltinIconMetadata(icon)
    const builtinIconRenderModel = resolveBuiltinIconRenderModel(iconMetadata)

    if (builtinIconRenderModel.type === 'missing') {
      return (
        <span
          className={cn(ICON_TILE_CLASS, ICON_FALLBACK_CLASS, wrapperClassName ?? 'size-11 rounded-md text-sm')}
          aria-hidden="true"
        >
          {getFallbackLetter(link.name)}
        </span>
      )
    }

    return (
      <span className={cn(ICON_TILE_CLASS, wrapperClassName ?? 'size-11 rounded-md text-sm')}>
        <BuiltinIconPreview
          icon={iconMetadata}
          className={cn('object-contain', imageClassName ?? 'size-7 rounded-sm')}
        />
      </span>
    )
  }

  const imageFailed = resolvedImageUrl ? failedImageUrl === resolvedImageUrl : false

  if (!resolvedImageUrl || imageFailed) {
    return (
      <span
        className={cn(ICON_TILE_CLASS, ICON_FALLBACK_CLASS, wrapperClassName ?? 'size-11 rounded-md text-sm')}
        aria-hidden="true"
      >
        {getFallbackLetter(link.name)}
      </span>
    )
  }

  return (
    <span className={cn(ICON_TILE_CLASS, wrapperClassName ?? 'size-11 rounded-md text-sm')}>
      <img
        src={resolvedImageUrl}
        alt=""
        className={cn('object-contain', imageClassName ?? 'size-7 rounded-sm')}
        loading="lazy"
        onLoad={() => setLoadedImageUrl(resolvedImageUrl)}
        onError={() => setFailedImageUrl(resolvedImageUrl)}
      />
    </span>
  )
}

/** Extracts initials from the link name for icon fallback display. */
function getFallbackLetter(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase() || '?'
}
