// Registers the PWA service worker and surfaces offline/update state through app toasts.

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Shows install lifecycle feedback for the generated service worker. */
export function PwaUpdateToaster() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service worker registration failed.', error)
    },
  })

  useEffect(() => {
    if (!offlineReady) {
      return
    }

    toast.success('Link Deck is ready for offline use.', {
      id: 'pwa-offline-ready',
      onDismiss: () => setOfflineReady(false),
    })
  }, [offlineReady, setOfflineReady])

  useEffect(() => {
    if (!needRefresh) {
      return
    }

    toast.info('A new version of Link Deck is available.', {
      id: 'pwa-update-ready',
      action: {
        label: 'Refresh',
        onClick: () => updateServiceWorker(true),
      },
      cancel: {
        label: 'Later',
        onClick: () => setNeedRefresh(false),
      },
      duration: Infinity,
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
