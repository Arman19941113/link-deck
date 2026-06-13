// Defines serializable link icon value objects shared by deck records and icon UI.

export type SavedLinkIcon =
  | { type: 'auto' }
  | { type: 'builtin'; slug: string; title: string; hex: string }
  | { type: 'url'; url: string }
  | { type: 'file'; fileId: string; name: string; mimeType: string }
