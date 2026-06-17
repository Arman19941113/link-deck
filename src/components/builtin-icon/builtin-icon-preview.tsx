// Renders a built-in brand icon preview from local SVG data.

import { Link as LinkIconGlyph } from 'lucide-react'

import { resolveBuiltinIconRenderModel, type BuiltinIconOption } from './builtin-icon-registry'
import { cn } from '@/lib/utils'

type BuiltinIconPreviewProps = {
  icon: BuiltinIconOption
  className?: string
  decorative?: boolean
}

type BuiltinIconPreviewTileProps = BuiltinIconPreviewProps & {
  iconClassName?: string
}

/** Displays a built-in brand icon from its local SVG data. */
export function BuiltinIconPreview({ icon, className, decorative = false }: BuiltinIconPreviewProps) {
  const renderModel = resolveBuiltinIconRenderModel(icon)

  if (renderModel.type === 'generic') {
    return (
      <LinkIconGlyph
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : renderModel.title}
        className={cn('size-4 shrink-0', className)}
        style={{ color: `#${renderModel.color}` }}
      />
    )
  }

  if (renderModel.type === 'missing') {
    return (
      <span
        className={cn('size-4 shrink-0 rounded-sm', className)}
        style={{ backgroundColor: `#${renderModel.color}` }}
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : renderModel.title}
      />
    )
  }

  return (
    <svg
      viewBox={`0 0 ${renderModel.width} ${renderModel.height}`}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : renderModel.title}
      className={cn('size-4 shrink-0', className)}
      style={{ color: `#${renderModel.color}` }}
      dangerouslySetInnerHTML={{ __html: renderModel.body }}
    />
  )
}

/** Wraps built-in icons in the same contrast tile used by link cards. */
export function BuiltinIconPreviewTile({
  icon,
  className,
  iconClassName,
  decorative = false,
}: BuiltinIconPreviewTileProps) {
  return (
    <span className={cn('app-icon-tile flex shrink-0 items-center justify-center border', className)}>
      <BuiltinIconPreview icon={icon} className={iconClassName} decorative={decorative} />
    </span>
  )
}
