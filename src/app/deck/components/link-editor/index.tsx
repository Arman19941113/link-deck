// Link add and edit editor that composes form layout with link editor state.

import { IconSourceFields } from './icon-source-fields'
import { useLinkEditorForm } from './use-link-editor-form'
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
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { UpsertLinkInput } from '@/domain/deck/link-upsert-plan'
import type { Category, StoredIconFile, SavedLink } from '@/domain/deck/types'
import { cn } from '@/lib/utils'

type LinkEditorProps = {
  open: boolean
  link?: SavedLink | null
  defaultCategoryId?: string | null
  categories: Category[]
  displaySizeConfig: DisplaySizeConfig
  loadStoredIconFile: (id: string) => Promise<StoredIconFile | undefined>
  onOpenChange: (open: boolean) => void
  upsertLink: (input: UpsertLinkInput) => Promise<SavedLink>
}

type LinkEditorFormProps = Omit<LinkEditorProps, 'open'>

/** Dialog shell for adding or editing a saved link, using a key to reset internal form state. */
export function LinkEditor({
  open,
  link,
  defaultCategoryId,
  categories,
  displaySizeConfig,
  loadStoredIconFile,
  onOpenChange,
  upsertLink,
}: LinkEditorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <LinkEditorForm
        key={`${open ? 'open' : 'closed'}-${link?.id ?? 'new'}-${
          defaultCategoryId ?? 'default'
        }-${link?.updatedAt ?? ''}-${categories[0]?.id ?? 'none'}`}
        link={link}
        defaultCategoryId={defaultCategoryId}
        categories={categories}
        displaySizeConfig={displaySizeConfig}
        loadStoredIconFile={loadStoredIconFile}
        onOpenChange={onOpenChange}
        upsertLink={upsertLink}
      />
    </Dialog>
  )
}

/** Form content for adding or editing a saved link. */
function LinkEditorForm({
  link,
  defaultCategoryId,
  categories,
  displaySizeConfig,
  loadStoredIconFile,
  onOpenChange,
  upsertLink,
}: LinkEditorFormProps) {
  const form = useLinkEditorForm({
    link,
    defaultCategoryId,
    categories,
    loadStoredIconFile,
    onOpenChange,
    upsertLink,
  })

  return (
    <DialogContent
      className={cn(
        'grid-rows-[auto_auto] overflow-y-auto',
        displaySizeConfig.dialog.surfaceClassName,
        'h-auto! max-h-[calc(100svh-2rem)]!',
      )}
    >
      <DialogHeader className={displaySizeConfig.dialog.headerClassName}>
        <DialogTitle className={displaySizeConfig.dialog.titleClassName}>{form.editorTitle}</DialogTitle>
        <DialogDescription className={displaySizeConfig.dialog.descriptionClassName}>
          Save the link details and choose how its icon should appear.
        </DialogDescription>
      </DialogHeader>

      <form className={displaySizeConfig.dialog.formClassName} onSubmit={event => void form.handleSubmit(event)}>
        <div className={displaySizeConfig.dialog.fieldClassName}>
          <Label htmlFor="link-editor-url" className={displaySizeConfig.control.labelClassName}>
            Link URL
          </Label>
          <Input
            id="link-editor-url"
            className={displaySizeConfig.control.inputClassName}
            value={form.url}
            required
            type="url"
            placeholder="https://example.com"
            disabled={form.isSaving}
            aria-invalid={!form.url.trim() && Boolean(form.error)}
            onChange={event => form.setUrl(event.target.value)}
          />
        </div>

        <div
          className={
            form.shouldShowCategorySelect
              ? displaySizeConfig.dialog.gridClassName
              : displaySizeConfig.dialog.fieldClassName
          }
        >
          <div className={displaySizeConfig.dialog.fieldClassName}>
            <Label htmlFor="link-editor-name" className={displaySizeConfig.control.labelClassName}>
              Title
            </Label>
            <Input
              id="link-editor-name"
              className={displaySizeConfig.control.inputClassName}
              value={form.name}
              placeholder="Use link address if empty"
              disabled={form.isSaving}
              onChange={event => form.setName(event.target.value)}
            />
          </div>

          {form.shouldShowCategorySelect ? (
            <div className={displaySizeConfig.dialog.fieldClassName}>
              <Label htmlFor="link-editor-category" className={displaySizeConfig.control.labelClassName}>
                Category
              </Label>
              <Select
                value={form.selectedCategoryId}
                disabled={form.isSaving || !form.hasCategories}
                onValueChange={form.setCategoryId}
              >
                <SelectTrigger
                  id="link-editor-category"
                  className={cn('w-full', displaySizeConfig.control.inputClassName)}
                  aria-invalid={!form.selectedCategoryId && Boolean(form.error)}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {form.sortedCategories.map(category => (
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
          <Label htmlFor="link-editor-note" className={displaySizeConfig.control.labelClassName}>
            Notes
          </Label>
          <Textarea
            id="link-editor-note"
            className={cn(displaySizeConfig.control.textareaClassName, 'h-auto min-h-0 resize-none')}
            value={form.note}
            rows={2}
            disabled={form.isSaving}
            onChange={event => form.setNote(event.target.value)}
          />
        </div>

        <IconSourceFields
          displaySizeConfig={displaySizeConfig}
          iconMode={form.iconMode}
          builtinIcon={form.builtinIcon}
          iconUrl={form.iconUrl}
          error={form.error}
          isSaving={form.isSaving}
          currentFileLabel={form.currentFileLabel}
          currentFileMeta={form.currentFileMeta}
          currentFilePreviewUrl={form.currentFilePreviewUrl}
          isIconFileInvalid={form.isIconFileInvalid}
          onBuiltinIconChange={icon => {
            form.setBuiltinIcon(icon)
            form.setError(null)
          }}
          onIconFileChange={form.handleIconFileChange}
          onIconModeChange={form.handleIconModeChange}
          onIconUrlChange={form.setIconUrl}
        />

        <DialogFooter className={cn('mt-3', displaySizeConfig.dialog.footerClassName)}>
          <Button
            type="button"
            variant="outline"
            size={displaySizeConfig.control.buttonSize}
            disabled={form.isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size={displaySizeConfig.control.buttonSize}
            disabled={form.isSaving || !form.hasCategories}
          >
            {form.isSaving ? 'Saving...' : 'Save link'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
