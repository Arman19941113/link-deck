// Provides browser-backed deck backup import and export operations.

import {
  createDeckBackupPayload as createDomainDeckBackupPayload,
  parseDeckBackupPayload as parseDomainDeckBackupPayload,
  type DeckBackupPayload,
} from '@/domain/deck/deck-backup'
import type { PersistedAppState } from '@/domain/deck/types'
import { blobToDataUrl, dataUrlToBlob } from './blob-data-url'

const BROWSER_BLOB_CODEC = {
  encodeBlob: blobToDataUrl,
  decodeDataUrl: dataUrlToBlob,
}

/** Creates a portable backup payload using browser Blob readers. */
export function createDeckBackupPayload(deck: PersistedAppState): Promise<DeckBackupPayload> {
  return createDomainDeckBackupPayload(deck, BROWSER_BLOB_CODEC)
}

/** Parses a portable backup payload using browser data URL decoding. */
export function parseDeckBackupPayload(json: string): Promise<PersistedAppState> {
  return parseDomainDeckBackupPayload(json, BROWSER_BLOB_CODEC)
}
