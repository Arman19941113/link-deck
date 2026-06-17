// Coordinates link editor form state, validation, previews, and submit handling.

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  ACCEPTED_ICON_MIME_TYPES,
  formatFileSize,
  getFallbackLinkName,
  getInitialIconMode,
  MAX_ICON_FILE_SIZE,
  type IconMode,
} from './constants'
import { DEFAULT_BUILTIN_ICON } from '@/components/builtin-icon/builtin-icon-registry'
import { DEFAULT_CATEGORY_ID, sortCategoriesByOrder } from '@/domain/deck/categories'
import type { UpsertLinkInput } from '@/domain/deck/link-upsert-plan'
import type { SavedLinkIcon } from '@/domain/deck/icon-types'
import type { Category, SavedLink, StoredIconFile } from '@/domain/deck/types'

type BuiltinIconValue = Extract<SavedLinkIcon, { type: 'builtin' }>

type UseLinkEditorFormParams = {
  link?: SavedLink | null
  defaultCategoryId?: string | null
  categories: Category[]
  loadStoredIconFile: (id: string) => Promise<StoredIconFile | undefined>
  onOpenChange: (open: boolean) => void
  upsertLink: (input: UpsertLinkInput) => Promise<SavedLink>
}

type SavedIconPreview = {
  fileId: string
  size: number
  url: string
}

/** Manages all mutable form state so the LinkEditor component can stay focused on layout. */
export function useLinkEditorForm({
  link,
  defaultCategoryId,
  categories,
  loadStoredIconFile,
  onOpenChange,
  upsertLink,
}: UseLinkEditorFormParams) {
  const { t } = useTranslation()
  const sortedCategories = useMemo(() => sortCategoriesByOrder(categories), [categories])
  const fallbackCategoryId =
    sortedCategories.find(category => category.id === DEFAULT_CATEGORY_ID)?.id ?? sortedCategories[0]?.id ?? ''
  const [name, setName] = useState(link?.name ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const preferredCategoryId = defaultCategoryId ?? fallbackCategoryId
  const [categoryId, setCategoryId] = useState(link?.categoryId ?? preferredCategoryId)
  const [note, setNote] = useState(link?.note ?? '')
  const [iconMode, setIconMode] = useState<IconMode>(getInitialIconMode(link))
  const [builtinIcon, setBuiltinIcon] = useState<BuiltinIconValue | null>(
    link?.icon.type === 'builtin' ? link.icon : null,
  )
  const [iconUrl, setIconUrl] = useState(link?.icon.type === 'url' ? link.icon.url : '')
  const [iconFile, setIconFile] = useState<File | null>(null)
  const pendingFileIconPreviewUrlRef = useRef<string | null>(null)
  const [pendingFileIconPreviewUrl, setPendingFileIconPreviewUrl] = useState<string | null>(null)
  const [existingFileIconPreview, setExistingFileIconPreview] = useState<SavedIconPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const editorTitle = link ? t('linkEditor.editTitle') : t('linkEditor.addTitle')
  const selectedCategoryId = categoryId || preferredCategoryId
  const hasCategories = categories.length > 0
  const shouldShowCategorySelect = Boolean(link) || !defaultCategoryId
  const savedIconFileId = link?.icon.type === 'file' ? link.icon.fileId : null
  const activeExistingFileIconPreview =
    savedIconFileId && existingFileIconPreview?.fileId === savedIconFileId ? existingFileIconPreview : null
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
    : activeExistingFileIconPreview
      ? formatFileSize(activeExistingFileIconPreview.size)
      : ''
  const currentFilePreviewUrl = pendingFileIconPreviewUrl ?? activeExistingFileIconPreview?.url ?? null

  useEffect(() => {
    return () => {
      if (pendingFileIconPreviewUrlRef.current) {
        URL.revokeObjectURL(pendingFileIconPreviewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!savedIconFileId) {
      return
    }

    let canceled = false
    let previewUrl: string | null = null

    void loadStoredIconFile(savedIconFileId).then(savedIconFile => {
      if (canceled || !savedIconFile) {
        return
      }

      previewUrl = URL.createObjectURL(savedIconFile.blob)
      setExistingFileIconPreview({
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
  }, [loadStoredIconFile, savedIconFileId])

  /** Clears the pending local file selection and releases its preview URL. */
  function clearSelectedIconFile(): void {
    setIconFile(null)

    if (pendingFileIconPreviewUrlRef.current) {
      URL.revokeObjectURL(pendingFileIconPreviewUrlRef.current)
      pendingFileIconPreviewUrlRef.current = null
    }

    setPendingFileIconPreviewUrl(null)
  }

  /** Stores form error state for invalid fields while showing the message through the global toaster. */
  function showError(message: string): void {
    setError(message)
    toast.error(message, { id: 'link-editor-error' })
  }

  /** Updates the icon mode and clears stale state for sources that are no longer active. */
  function handleIconModeChange(nextIconMode: IconMode): void {
    setIconMode(nextIconMode)

    if (nextIconMode === 'builtin' && !builtinIcon) {
      setBuiltinIcon(DEFAULT_BUILTIN_ICON)
    }

    if (nextIconMode !== 'file') {
      clearSelectedIconFile()
    }

    setError(null)
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
      showError(t('linkEditor.errors.chooseIconFileType'))
      return
    }

    const previewUrl = URL.createObjectURL(file)

    pendingFileIconPreviewUrlRef.current = previewUrl
    setPendingFileIconPreviewUrl(previewUrl)

    if (file.size > MAX_ICON_FILE_SIZE) {
      showError(t('linkEditor.errors.iconFileTooLarge'))
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
      showError(t('linkEditor.errors.enterLinkUrl'))
      return
    }

    if (!selectedCategoryId) {
      showError(t('linkEditor.errors.selectCategory'))
      return
    }

    if (iconMode === 'builtin' && !builtinIcon) {
      showError(t('linkEditor.errors.chooseBuiltinIcon'))
      return
    }

    if (iconMode === 'url' && !trimmedIconUrl) {
      showError(t('linkEditor.errors.enterIconUrl'))
      return
    }

    if (iconMode === 'file' && iconFile && !ACCEPTED_ICON_MIME_TYPES.has(iconFile.type)) {
      showError(t('linkEditor.errors.chooseIconFileType'))
      return
    }

    if (iconMode === 'file' && iconFile && iconFile.size > MAX_ICON_FILE_SIZE) {
      showError(t('linkEditor.errors.iconFileTooLarge'))
      return
    }

    if (iconMode === 'file' && !iconFile && link?.icon.type !== 'file') {
      showError(t('linkEditor.errors.chooseLocalIconFile'))
      return
    }

    const icon = createSubmittedIcon(iconMode, trimmedIconUrl, builtinIcon, link)

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
      showError(getEditorErrorMessage(saveError, t('linkEditor.errors.saveFailed')))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    builtinIcon,
    categoryId,
    currentFileLabel,
    currentFileMeta,
    currentFilePreviewUrl,
    editorTitle,
    error,
    handleIconFileChange,
    handleIconModeChange,
    handleSubmit,
    hasCategories,
    iconMode,
    iconUrl,
    isIconFileInvalid,
    isSaving,
    name,
    note,
    selectedCategoryId,
    setBuiltinIcon,
    setCategoryId,
    setError,
    setIconUrl,
    setName,
    setNote,
    setUrl,
    shouldShowCategorySelect,
    sortedCategories,
    url,
  }
}

function createSubmittedIcon(
  iconMode: IconMode,
  trimmedIconUrl: string,
  builtinIcon: BuiltinIconValue | null,
  link?: SavedLink | null,
): SavedLinkIcon | undefined {
  if (iconMode === 'auto') {
    return { type: 'auto' }
  }

  if (iconMode === 'builtin') {
    return builtinIcon ?? undefined
  }

  if (iconMode === 'url') {
    return { type: 'url', url: trimmedIconUrl }
  }

  if (link?.icon.type === 'file') {
    return link.icon
  }

  return undefined
}

function getEditorErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}
