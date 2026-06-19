// Registers the PWA service worker and surfaces offline/update state through app toasts.

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Shows install lifecycle feedback for the generated service worker. */
export function PwaUpdateToaster() {
  const { t } = useTranslation()
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

    toast.success(t('app.pwa.offlineReady'), {
      id: 'pwa-offline-ready',
      onDismiss: () => setOfflineReady(false),
    })
  }, [offlineReady, setOfflineReady, t])

  useEffect(() => {
    if (!needRefresh) {
      return
    }

    toast.info(t('app.pwa.updateReady'), {
      id: 'pwa-update-ready',
      className: 'pwa-update-toast',
      closeButton: false,
      icon: null,
      richColors: false,
      action: {
        label: t('app.pwa.refresh'),
        onClick: () => updateServiceWorker(true),
      },
      cancel: {
        label: t('app.pwa.later'),
        onClick: () => setNeedRefresh(false),
      },
      duration: Infinity,
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, t, updateServiceWorker])

  return null
}
