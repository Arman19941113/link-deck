// Defines global display-size UI options and semantic sizing tokens.

import type { DisplaySize } from '@/domain/settings/types'

type DisplaySizeOption = {
  description: string
  value: DisplaySize
  label: string
}

export type DisplaySizeConfig = {
  page: {
    className: string
    stackClassName: string
  }
  topBar: {
    className: string
    titleClassName: string
    actionsClassName: string
  }
  section: {
    className: string
    titleClassName: string
  }
  control: {
    buttonSize: 'compact' | 'default' | 'spacious'
    iconButtonSize: 'icon-compact' | 'icon-sm' | 'icon-spacious'
    inputClassName: string
    textareaClassName: string
    searchInputClassName: string
    searchIconClassName: string
    searchClearButtonClassName: string
    labelClassName: string
  }
  dialog: {
    surfaceClassName: string
    contentClassName: string
    headerClassName: string
    titleClassName: string
    descriptionClassName: string
    formClassName: string
    fieldClassName: string
    gridClassName: string
    footerClassName: string
  }
  card: {
    minColumnWidth: string
    height: string
    gridClassName: string
    paddingClassName: string
    actionPaddingClassName: string
    contentGapClassName: string
    textGapClassName: string
    iconBoxClassName: string
    iconImageClassName: string
    titleClassName: string
    noteClassName: string
    addIconBoxClassName: string
    addTitleClassName: string
    addNoteClassName: string
  }
}

export const DISPLAY_SIZE_OPTIONS: DisplaySizeOption[] = [
  { value: 'compact', label: 'Compact', description: 'Dense layout across the app' },
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing and reading' },
  { value: 'spacious', label: 'Spacious', description: 'Larger controls and more reading room' },
]

const DISPLAY_SIZE_CONFIG: Record<DisplaySize, DisplaySizeConfig> = {
  compact: {
    page: {
      className: 'mx-auto flex w-full max-w-7xl flex-col px-3 py-3 sm:px-4 sm:py-4',
      stackClassName: 'flex flex-col gap-3',
    },
    topBar: {
      className: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
      titleClassName: 'truncate text-xl leading-tight font-medium tracking-normal',
      actionsClassName: 'flex flex-wrap items-center gap-1.5',
    },
    section: {
      className: 'flex flex-col gap-2 rounded-md',
      titleClassName: 'min-w-0 flex-1 truncate text-base leading-tight font-medium tracking-normal',
    },
    control: {
      buttonSize: 'compact',
      iconButtonSize: 'icon-compact',
      inputClassName: 'h-9 rounded-md px-3 text-sm md:text-sm',
      textareaClassName: 'min-h-20 rounded-md px-3 py-2 text-sm md:text-sm',
      searchInputClassName: 'pr-9 pl-9',
      searchIconClassName: 'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
      searchClearButtonClassName: 'absolute top-1/2 right-1.5 -translate-y-1/2',
      labelClassName: 'text-xs',
    },
    dialog: {
      surfaceClassName: 'h-[576px] w-[640px] max-h-none max-w-none sm:max-w-none',
      contentClassName: 'max-h-[calc(100svh-1.5rem)] gap-3 p-4 sm:max-w-lg',
      headerClassName: 'gap-1.5',
      titleClassName: 'text-base leading-tight font-semibold',
      descriptionClassName: 'text-xs text-muted-foreground',
      formClassName: 'flex flex-col gap-3',
      fieldClassName: 'flex flex-col gap-1.5',
      gridClassName: 'grid gap-3 sm:grid-cols-2',
      footerClassName: 'gap-1.5',
    },
    card: {
      minColumnWidth: '13rem',
      height: '4rem',
      gridClassName: 'grid gap-2',
      paddingClassName: 'py-3 pr-2.5 pl-3',
      actionPaddingClassName: 'p-1.5',
      contentGapClassName: 'gap-2',
      textGapClassName: 'gap-0.5',
      iconBoxClassName: 'size-10 rounded-md text-xs',
      iconImageClassName: 'size-5 rounded-sm',
      titleClassName: 'text-sm leading-tight font-medium',
      noteClassName: 'line-clamp-1 break-words text-xs leading-5 text-muted-foreground',
      addIconBoxClassName: 'size-10 rounded-md',
      addTitleClassName: 'text-sm leading-tight font-medium',
      addNoteClassName: 'line-clamp-1 text-xs leading-5 text-muted-foreground/85',
    },
  },
  comfortable: {
    page: {
      className: 'mx-auto flex w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6',
      stackClassName: 'flex flex-col gap-4',
    },
    topBar: {
      className: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
      titleClassName: 'truncate text-2xl leading-tight font-medium tracking-normal',
      actionsClassName: 'flex flex-wrap items-center gap-2',
    },
    section: {
      className: 'flex flex-col gap-3 rounded-md',
      titleClassName: 'min-w-0 flex-1 truncate text-lg leading-tight font-medium tracking-normal',
    },
    control: {
      buttonSize: 'default',
      iconButtonSize: 'icon-sm',
      inputClassName: 'h-11 rounded-md px-3 text-base md:text-sm',
      textareaClassName: 'min-h-24 rounded-md px-3 py-2 text-base md:text-sm',
      searchInputClassName: 'pr-12 pl-11',
      searchIconClassName: 'pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground',
      searchClearButtonClassName: 'absolute top-1/2 right-2 -translate-y-1/2',
      labelClassName: 'text-sm',
    },
    dialog: {
      surfaceClassName: 'h-[592px] w-[672px] max-h-none max-w-none sm:max-w-none',
      contentClassName: 'max-h-[calc(100svh-2rem)] gap-4 p-6 sm:max-w-xl',
      headerClassName: 'gap-2',
      titleClassName: 'text-lg leading-none font-semibold',
      descriptionClassName: 'text-sm text-muted-foreground',
      formClassName: 'flex flex-col gap-4',
      fieldClassName: 'flex flex-col gap-2',
      gridClassName: 'grid gap-4 sm:grid-cols-2',
      footerClassName: 'gap-2',
    },
    card: {
      minColumnWidth: '17.75rem',
      height: '4.5rem',
      gridClassName: 'grid gap-3',
      paddingClassName: 'py-3 pr-3 pl-3.5',
      actionPaddingClassName: 'p-2',
      contentGapClassName: 'gap-3',
      textGapClassName: 'gap-1',
      iconBoxClassName: 'size-11 rounded-md text-sm',
      iconImageClassName: 'size-7 rounded-sm',
      titleClassName: 'text-base leading-tight font-medium',
      noteClassName: 'line-clamp-1 break-words text-sm leading-5 text-muted-foreground',
      addIconBoxClassName: 'size-11 rounded-md',
      addTitleClassName: 'text-sm leading-tight font-medium',
      addNoteClassName: 'line-clamp-2 text-xs leading-snug text-muted-foreground/85',
    },
  },
  spacious: {
    page: {
      className: 'mx-auto flex w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-8',
      stackClassName: 'flex flex-col gap-5',
    },
    topBar: {
      className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
      titleClassName: 'truncate text-3xl leading-tight font-medium tracking-normal',
      actionsClassName: 'flex flex-wrap items-center gap-2.5',
    },
    section: {
      className: 'flex flex-col gap-4 rounded-md',
      titleClassName: 'min-w-0 flex-1 truncate text-xl leading-tight font-medium tracking-normal',
    },
    control: {
      buttonSize: 'spacious',
      iconButtonSize: 'icon-spacious',
      inputClassName: 'h-12 rounded-md px-4 text-base md:text-base',
      textareaClassName: 'min-h-28 rounded-md px-4 py-3 text-base md:text-base',
      searchInputClassName: 'pr-12 pl-12',
      searchIconClassName: 'pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground',
      searchClearButtonClassName: 'absolute top-1/2 right-2 -translate-y-1/2',
      labelClassName: 'text-sm',
    },
    dialog: {
      surfaceClassName: 'h-[608px] w-[704px] max-h-none max-w-none sm:max-w-none',
      contentClassName: 'max-h-[calc(100svh-2.5rem)] gap-5 p-7 sm:max-w-2xl',
      headerClassName: 'gap-2.5',
      titleClassName: 'text-xl leading-tight font-semibold',
      descriptionClassName: 'text-base text-muted-foreground',
      formClassName: 'flex flex-col gap-5',
      fieldClassName: 'flex flex-col gap-2.5',
      gridClassName: 'grid gap-5 sm:grid-cols-2',
      footerClassName: 'gap-2.5',
    },
    card: {
      minColumnWidth: '22rem',
      height: '5rem',
      gridClassName: 'grid gap-4',
      paddingClassName: 'p-4',
      actionPaddingClassName: 'p-3',
      contentGapClassName: 'gap-4',
      textGapClassName: 'gap-1.5',
      iconBoxClassName: 'size-12 rounded-lg text-base',
      iconImageClassName: 'size-8 rounded-sm',
      titleClassName: 'text-base leading-tight font-medium',
      noteClassName: 'line-clamp-1 break-words text-sm leading-5 text-muted-foreground',
      addIconBoxClassName: 'size-12 rounded-lg',
      addTitleClassName: 'text-base leading-tight font-medium',
      addNoteClassName: 'line-clamp-1 text-sm leading-snug text-muted-foreground/85',
    },
  },
}

/** Returns the display configuration for the selected global display size. */
export function getDisplaySizeConfig(displaySize: DisplaySize): DisplaySizeConfig {
  return DISPLAY_SIZE_CONFIG[displaySize]
}
