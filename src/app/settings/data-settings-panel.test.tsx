// Verifies data settings action controls and disabled/busy states.

import { createRef, type ChangeEvent } from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/i18n'
import { DataSettingsPanel } from './data-settings-panel'
import type { DestructiveDataAction } from './types'

describe('DataSettingsPanel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh')
  })

  it('routes import, export, reset, and clear controls through callbacks', async () => {
    const user = userEvent.setup()
    const actions = renderDataSettingsPanel()

    await user.click(screen.getByRole('button', { name: '导入' }))
    expect(actions.onImportRequest).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '导出' }))
    expect(actions.onExportDeck).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '重置' }))
    expect(actions.onDestructiveDataActionRequest).toHaveBeenCalledWith('reset')

    await user.click(screen.getByRole('button', { name: '清空数据' }))
    expect(actions.onDestructiveDataActionRequest).toHaveBeenCalledWith('clear')
  })

  it('disables all data controls when actions are unavailable', async () => {
    const user = userEvent.setup()
    const actions = renderDataSettingsPanel({ canUseDataControls: false })

    await user.click(screen.getByRole('button', { name: '导入' }))
    await user.click(screen.getByRole('button', { name: '导出' }))
    await user.click(screen.getByRole('button', { name: '重置' }))
    await user.click(screen.getByRole('button', { name: '清空数据' }))

    expect(actions.onImportRequest).not.toHaveBeenCalled()
    expect(actions.onExportDeck).not.toHaveBeenCalled()
    expect(actions.onDestructiveDataActionRequest).not.toHaveBeenCalled()
  })

  it('shows the importing label and export busy state while data actions run', () => {
    const { rerenderDataSettingsPanel } = renderDataSettingsPanel({ busyAction: 'import' })

    expect(screen.getByRole('button', { name: '导入中...' })).toBeInTheDocument()

    rerenderDataSettingsPanel({ busyAction: 'export' })

    expect(screen.getByRole('button', { name: '导出' })).toHaveAttribute('aria-busy', 'true')
  })
})

type RenderDataSettingsPanelOptions = {
  busyAction?: 'import' | 'export' | null
  canUseDataControls?: boolean
}

function renderDataSettingsPanel(options: RenderDataSettingsPanelOptions = {}) {
  const actions: DataSettingsPanelActions = {
    onDestructiveDataActionRequest: vi.fn<(action: DestructiveDataAction) => void>(),
    onExportDeck: vi.fn<() => void>(),
    onImportFileChange: vi.fn<(event: ChangeEvent<HTMLInputElement>) => void>(),
    onImportRequest: vi.fn<() => void>(),
  }

  const importFileInputRef = createRef<HTMLInputElement>()
  const renderResult = render(createDataSettingsPanel(options, actions, importFileInputRef))

  function rerenderDataSettingsPanel(nextOptions: RenderDataSettingsPanelOptions): void {
    renderResult.rerender(createDataSettingsPanel(nextOptions, actions, importFileInputRef))
  }

  return { ...actions, rerenderDataSettingsPanel }
}

function createDataSettingsPanel(
  options: RenderDataSettingsPanelOptions,
  actions: DataSettingsPanelActions,
  importFileInputRef: React.RefObject<HTMLInputElement | null>,
) {
  return (
    <DataSettingsPanel
      importFileInputRef={importFileInputRef}
      canUseDataControls={options.canUseDataControls ?? true}
      busyAction={options.busyAction ?? null}
      onImportRequest={actions.onImportRequest}
      onImportFileChange={actions.onImportFileChange}
      onExportDeck={actions.onExportDeck}
      onDestructiveDataActionRequest={actions.onDestructiveDataActionRequest}
    />
  )
}

type DataSettingsPanelActions = {
  onDestructiveDataActionRequest: ReturnType<typeof vi.fn<(action: DestructiveDataAction) => void>>
  onExportDeck: ReturnType<typeof vi.fn<() => void>>
  onImportFileChange: ReturnType<typeof vi.fn<(event: ChangeEvent<HTMLInputElement>) => void>>
  onImportRequest: ReturnType<typeof vi.fn<() => void>>
}
