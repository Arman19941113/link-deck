// Links settings panel for global link ordering preferences.

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortMode } from '@/domain/deck/types'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

type LinksSettingsPanelProps = {
  displaySizeConfig: DisplaySizeConfig
  sortMode: SortMode
  onSortModeChange: (sortMode: SortMode) => void
}

const SORT_LABELS: Record<SortMode, string> = {
  manual: 'Manual order',
  name: 'Title (A-Z)',
}

/** Renders link ordering controls that are applied immediately. */
export function LinksSettingsPanel({ displaySizeConfig, sortMode, onSortModeChange }: LinksSettingsPanelProps) {
  return (
    <div className={cn('max-w-xl', displaySizeConfig.dialog.formClassName)}>
      <div className={displaySizeConfig.dialog.fieldClassName}>
        <Label htmlFor="settings-link-order" className={displaySizeConfig.control.labelClassName}>
          Saved links order
        </Label>
        <Select
          value={sortMode}
          onValueChange={value => {
            onSortModeChange(value as SortMode)
          }}
        >
          <SelectTrigger
            id="settings-link-order"
            className={cn('w-full bg-card', displaySizeConfig.control.inputClassName)}
          >
            <SelectValue placeholder="Select a link order">{SORT_LABELS[sortMode]}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
