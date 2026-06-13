// Link add and edit dialog that collects form fields and submits them to the deck store.

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

import { BuiltinIconField } from '@/components/brand-icon-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_CATEGORY_ID } from '@/domain/categories'
import type { DisplaySizeConfig } from '@/domain/display-size'
import { DEFAULT_BUILTIN_ICON } from '@/domain/brand-icons'
import type { Category, IconFile, Link, LinkIcon } from '@/domain/types'
import type { LinkInput } from '@/hooks/use-deck-store'
import { cn } from '@/lib/utils'

type IconMode = 'auto' | 'builtin' | 'url' | 'file'
type BuiltinIconValue = Extract<LinkIcon, { type: 'builtin' }>

type LinkDialogProps = {
  open: boolean
  link?: Link | null
  initialCategoryId?: string | null
  categories: Category[]
  displaySizeConfig: DisplaySizeConfig
  getIconFile: (id: string) => Promise<IconFile | undefined>
  onOpenChange: (open: boolean) => void
  upsertLink: (input: LinkInput) => Promise<Link>
}

type LinkDialogFormProps = Omit<LinkDialogProps, 'open'>

const ICON_FILE_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml'
const MAX_ICON_FILE_SIZE = 1024 * 1024
const ACCEPTED_ICON_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const EXPLICIT_HTTP_SCHEME = /^https?:\/\//i

/** Derives the form icon mode from the current saved link icon settings. */
function getInitialIconMode(link?: Link | null): IconMode {
  if (!link || link.icon.type === 'auto') {
    return 'auto'
  }

  return link.icon.type
}

/** Converts unknown errors into short messages shown inside the dialog. */
function getDialogErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Save failed. Please try again later.'
}

/** Creates a readable default title when the user leaves the title field empty. */
function getFallbackLinkName(url: string): string {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return ''
  }

  try {
    const parsedUrl = new URL(EXPLICIT_HTTP_SCHEME.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`)
    return parsedUrl.host.replace(/^www\./i, '') || trimmedUrl
  } catch {
    return trimmedUrl
  }
}

/** Formats selected file sizes for compact helper text. */
function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/** Dialog shell for adding or editing a saved link, using a key to reset internal form state. */
export function LinkDialog({
  open,
  link,
  initialCategoryId,
  categories,
  displaySizeConfig,
  getIconFile,
  onOpenChange,
  upsertLink,
}: LinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <LinkDialogForm
        key={`${open ? 'open' : 'closed'}-${link?.id ?? 'new'}-${
          initialCategoryId ?? 'default'
        }-${link?.updatedAt ?? ''}-${categories[0]?.id ?? 'none'}`}
        link={link}
        initialCategoryId={initialCategoryId}
        categories={categories}
        displaySizeConfig={displaySizeConfig}
        getIconFile={getIconFile}
        onOpenChange={onOpenChange}
        upsertLink={upsertLink}
      />
    </Dialog>
  )
}

/** Form content for adding or editing a saved link. */
function LinkDialogForm({
  link,
  initialCategoryId,
  categories,
  displaySizeConfig,
  getIconFile,
  onOpenChange,
  upsertLink,
}: LinkDialogFormProps) {
  const sortedCategories = useMemo(() => [...categories].sort((left, right) => left.order - right.order), [categories])
  const defaultCategoryId =
    sortedCategories.find(category => category.id === DEFAULT_CATEGORY_ID)?.id ?? sortedCategories[0]?.id ?? ''
  const [name, setName] = useState(link?.name ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const [categoryId, setCategoryId] = useState(link?.categoryId ?? initialCategoryId ?? defaultCategoryId)
  const [note, setNote] = useState(link?.note ?? '')
  const [iconMode, setIconMode] = useState<IconMode>(getInitialIconMode(link))
  const [builtinIcon, setBuiltinIcon] = useState<BuiltinIconValue | null>(
    link?.icon.type === 'builtin' ? link.icon : null,
  )
  const [iconUrl, setIconUrl] = useState(link?.icon.type === 'url' ? link.icon.url : '')
  const [iconFile, setIconFile] = useState<File | null>(null)
  const selectedIconPreviewUrlRef = useRef<string | null>(null)
  const [selectedIconPreviewUrl, setSelectedIconPreviewUrl] = useState<string | null>(null)
  const [savedIconPreview, setSavedIconPreview] = useState<{
    fileId: string
    size: number
    url: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const dialogTitle = link ? 'Edit link' : 'Add link'
  const selectedCategoryId = categoryId || defaultCategoryId
  const hasCategories = categories.length > 0
  const shouldShowCategorySelect = Boolean(link) || !initialCategoryId
  const savedIconFileId = link?.icon.type === 'file' ? link.icon.fileId : null
  const currentSavedIconPreview =
    savedIconFileId && savedIconPreview?.fileId === savedIconFileId ? savedIconPreview : null
  const isIconFileInvalid = Boolean(
    iconFile && (!ACCEPTED_ICON_MIME_TYPES.has(iconFile.type) || iconFile.size > MAX_ICON_FILE_SIZE),
  )

  const currentFileLabel = useMemo(() => {
    if (iconFile) {
      return iconFile.name
    }

    return link?.icon.type === 'file' ? link.icon.name : ''
  }, [iconFile, link])
  const currentFileMeta = iconFile
    ? formatFileSize(iconFile.size)
    : currentSavedIconPreview
      ? formatFileSize(currentSavedIconPreview.size)
      : ''
  const currentFilePreviewUrl = selectedIconPreviewUrl ?? currentSavedIconPreview?.url ?? null

  useEffect(() => {
    return () => {
      if (selectedIconPreviewUrlRef.current) {
        URL.revokeObjectURL(selectedIconPreviewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!savedIconFileId) {
      return
    }
    let canceled = false
    let previewUrl: string | null = null

    void getIconFile(savedIconFileId).then(savedIconFile => {
      if (canceled || !savedIconFile) {
        return
      }

      previewUrl = URL.createObjectURL(savedIconFile.blob)
      setSavedIconPreview({
        fileId: savedIconFileId,
        size: savedIconFile.size,
        url: previewUrl,
      })
    })

    return () => {
      canceled = true

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [getIconFile, savedIconFileId])

  /** Clears the pending local file selection and releases its preview URL. */
  function clearSelectedIconFile(): void {
    setIconFile(null)

    if (selectedIconPreviewUrlRef.current) {
      URL.revokeObjectURL(selectedIconPreviewUrlRef.current)
      selectedIconPreviewUrlRef.current = null
    }

    setSelectedIconPreviewUrl(null)
  }

  /** Stores form error state for invalid fields while showing the message through the global toaster. */
  function showError(message: string): void {
    setError(message)
    toast.error(message, { id: 'link-dialog-error' })
  }

  /** Validates file size and stores the pending icon upload. */
  function handleIconFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null

    clearSelectedIconFile()

    if (!file) {
      setError(null)
      return
    }

    setIconFile(file)

    if (!ACCEPTED_ICON_MIME_TYPES.has(file.type)) {
      showError('Choose a PNG, JPEG, WebP, or SVG icon')
      return
    }

    const previewUrl = URL.createObjectURL(file)

    selectedIconPreviewUrlRef.current = previewUrl
    setSelectedIconPreviewUrl(previewUrl)

    if (file.size > MAX_ICON_FILE_SIZE) {
      showError('Icon files cannot exceed 1024KB')
      return
    }

    setError(null)
  }

  /** Builds link input and calls the store save action. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const trimmedUrl = url.trim()
    const trimmedName = name.trim() || getFallbackLinkName(trimmedUrl)
    const trimmedIconUrl = iconUrl.trim()

    if (!trimmedUrl) {
      showError('Enter a link URL')
      return
    }

    if (!selectedCategoryId) {
      showError('Select a category')
      return
    }

    if (iconMode === 'builtin' && !builtinIcon) {
      showError('Choose a built-in icon')
      return
    }

    if (iconMode === 'url' && !trimmedIconUrl) {
      showError('Enter an icon URL')
      return
    }

    if (iconMode === 'file' && iconFile && !ACCEPTED_ICON_MIME_TYPES.has(iconFile.type)) {
      showError('Choose a PNG, JPEG, WebP, or SVG icon')
      return
    }

    if (iconMode === 'file' && iconFile && iconFile.size > MAX_ICON_FILE_SIZE) {
      showError('Icon files cannot exceed 1024KB')
      return
    }

    if (iconMode === 'file' && !iconFile && link?.icon.type !== 'file') {
      showError('Choose a local icon file')
      return
    }

    const icon: LinkIcon | undefined =
      iconMode === 'auto'
        ? { type: 'auto' }
        : iconMode === 'builtin'
          ? (builtinIcon ?? undefined)
          : iconMode === 'url'
            ? { type: 'url', url: trimmedIconUrl }
            : link?.icon.type === 'file'
              ? link.icon
              : undefined

    setIsSaving(true)
    setError(null)

    try {
      await upsertLink({
        id: link?.id,
        categoryId: selectedCategoryId,
        name: trimmedName,
        url: trimmedUrl,
        note,
        icon,
        iconFile: iconMode === 'file' ? iconFile : null,
      })
      onOpenChange(false)
    } catch (saveError) {
      showError(getDialogErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent
      className={cn(
        'grid-rows-[auto_auto] overflow-y-auto',
        displaySizeConfig.dialog.surfaceClassName,
        'h-auto! max-h-[calc(100svh-2rem)]!',
      )}
    >
      <DialogHeader className={displaySizeConfig.dialog.headerClassName}>
        <DialogTitle className={displaySizeConfig.dialog.titleClassName}>{dialogTitle}</DialogTitle>
        <DialogDescription className={displaySizeConfig.dialog.descriptionClassName}>
          Save the link details and choose how its icon should appear.
        </DialogDescription>
      </DialogHeader>

      <form className={displaySizeConfig.dialog.formClassName} onSubmit={event => void handleSubmit(event)}>
        <div className={displaySizeConfig.dialog.fieldClassName}>
          <Label htmlFor="link-dialog-url" className={displaySizeConfig.control.labelClassName}>
            Link URL
          </Label>
          <Input
            id="link-dialog-url"
            className={displaySizeConfig.control.inputClassName}
            value={url}
            required
            type="url"
            placeholder="https://example.com"
            disabled={isSaving}
            aria-invalid={!url.trim() && Boolean(error)}
            onChange={event => setUrl(event.target.value)}
          />
        </div>

        <div
          className={
            shouldShowCategorySelect ? displaySizeConfig.dialog.gridClassName : displaySizeConfig.dialog.fieldClassName
          }
        >
          <div className={displaySizeConfig.dialog.fieldClassName}>
            <Label htmlFor="link-dialog-name" className={displaySizeConfig.control.labelClassName}>
              Title
            </Label>
            <Input
              id="link-dialog-name"
              className={displaySizeConfig.control.inputClassName}
              value={name}
              placeholder="Use link address if empty"
              disabled={isSaving}
              onChange={event => setName(event.target.value)}
            />
          </div>

          {shouldShowCategorySelect ? (
            <div className={displaySizeConfig.dialog.fieldClassName}>
              <Label htmlFor="link-dialog-category" className={displaySizeConfig.control.labelClassName}>
                Category
              </Label>
              <Select value={selectedCategoryId} disabled={isSaving || !hasCategories} onValueChange={setCategoryId}>
                <SelectTrigger
                  id="link-dialog-category"
                  className={cn('w-full', displaySizeConfig.control.inputClassName)}
                  aria-invalid={!selectedCategoryId && Boolean(error)}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sortedCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className={displaySizeConfig.dialog.fieldClassName}>
          <Label htmlFor="link-dialog-note" className={displaySizeConfig.control.labelClassName}>
            Notes
          </Label>
          <Textarea
            id="link-dialog-note"
            className={cn(displaySizeConfig.control.textareaClassName, 'h-auto min-h-0 resize-none')}
            value={note}
            rows={2}
            disabled={isSaving}
            onChange={event => setNote(event.target.value)}
          />
        </div>

        <div className={displaySizeConfig.dialog.gridClassName}>
          <div className={displaySizeConfig.dialog.fieldClassName}>
            <Label htmlFor="link-dialog-icon-mode" className={displaySizeConfig.control.labelClassName}>
              Icon source
            </Label>
            <Select
              value={iconMode}
              disabled={isSaving}
              onValueChange={value => {
                setIconMode(value as IconMode)
                if (value === 'builtin' && !builtinIcon) {
                  setBuiltinIcon(DEFAULT_BUILTIN_ICON)
                }
                if (value !== 'file') {
                  clearSelectedIconFile()
                }
                setError(null)
              }}
            >
              <SelectTrigger
                id="link-dialog-icon-mode"
                className={cn('w-full', displaySizeConfig.control.inputClassName)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="builtin">Built-in icon</SelectItem>
                  <SelectItem value="url">Image URL</SelectItem>
                  <SelectItem value="file">Local file</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {iconMode === 'auto' ? (
            <p className="self-end text-xs leading-5 text-muted-foreground">
              Use the website favicon automatically. If it is unavailable, show the title initial.
            </p>
          ) : null}

          {iconMode === 'builtin' ? (
            <BuiltinIconField
              value={builtinIcon}
              disabled={isSaving}
              displaySizeConfig={displaySizeConfig}
              onChange={icon => {
                setBuiltinIcon(icon)
                setError(null)
              }}
            />
          ) : null}

          {iconMode === 'url' ? (
            <div className={displaySizeConfig.dialog.fieldClassName}>
              <Label htmlFor="link-dialog-icon-url" className={displaySizeConfig.control.labelClassName}>
                Icon URL
              </Label>
              <Input
                id="link-dialog-icon-url"
                className={displaySizeConfig.control.inputClassName}
                value={iconUrl}
                type="url"
                placeholder="https://example.com/icon.png"
                disabled={isSaving}
                aria-invalid={!iconUrl.trim() && Boolean(error)}
                onChange={event => setIconUrl(event.target.value)}
              />
            </div>
          ) : null}

          {iconMode === 'file' ? (
            <div className={displaySizeConfig.dialog.fieldClassName}>
              <Label htmlFor="link-dialog-icon-file" className={displaySizeConfig.control.labelClassName}>
                Local file
              </Label>
              <Input
                id="link-dialog-icon-file"
                className="peer sr-only"
                type="file"
                accept={ICON_FILE_ACCEPT}
                disabled={isSaving}
                aria-invalid={isIconFileInvalid}
                onChange={handleIconFileChange}
              />
              <Label
                htmlFor="link-dialog-icon-file"
                className={cn(
                  displaySizeConfig.control.inputClassName,
                  'flex cursor-pointer items-center gap-3 border border-input bg-card shadow-xs transition-[border-color,box-shadow,opacity]',
                  'peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
                  isSaving && 'cursor-not-allowed opacity-50',
                  isIconFileInvalid && 'border-destructive ring-[3px] ring-destructive/20 dark:ring-destructive/40',
                )}
              >
                <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted text-muted-foreground">
                  {currentFilePreviewUrl ? (
                    <img src={currentFilePreviewUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Upload className="size-4" aria-hidden="true" />
                  )}
                </div>
                {currentFileLabel ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm leading-tight font-medium">{currentFileLabel}</p>
                    {currentFileMeta ? (
                      <p className="shrink-0 text-xs leading-5 text-muted-foreground">{currentFileMeta}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="min-w-0 flex-1 truncate text-sm leading-tight font-medium">Choose an icon file</p>
                )}
              </Label>
            </div>
          ) : null}
        </div>

        <DialogFooter className={cn('mt-3', displaySizeConfig.dialog.footerClassName)}>
          <Button
            type="button"
            variant="outline"
            size={displaySizeConfig.control.buttonSize}
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size={displaySizeConfig.control.buttonSize} disabled={isSaving || !hasCategories}>
            {isSaving ? 'Saving...' : 'Save link'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
