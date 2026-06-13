// Loads the deferred pinyin search module and shares the pending request.

type PinyinSearchModule = typeof import('@/domain/deck/pinyin-search')

let pinyinSearchModulePromise: Promise<PinyinSearchModule> | null = null

/** Loads pinyin search code once and reuses the same promise. */
export function loadPinyinSearchModule(): Promise<PinyinSearchModule> {
  pinyinSearchModulePromise ??= import('@/domain/deck/pinyin-search')

  return pinyinSearchModulePromise
}

/** Starts loading pinyin search code without blocking the current interaction. */
export function preloadPinyinSearchModule(): void {
  void loadPinyinSearchModule()
}
