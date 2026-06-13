// Serializes optimistic deck persistence tasks so local state updates stay ordered.

import { useCallback, useRef } from 'react'

/** Creates an enqueue function that keeps persistence tasks ordered. */
export function usePersistenceQueue(): (persist: () => Promise<void>) => Promise<void> {
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve())

  return useCallback((persist: () => Promise<void>): Promise<void> => {
    const persistenceTask = persistenceQueueRef.current.then(persist, persist)

    persistenceQueueRef.current = persistenceTask.catch(() => undefined)

    return persistenceTask
  }, [])
}
