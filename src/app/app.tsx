import { AppShell } from '@/app/app-shell'
import { PwaUpdateToaster } from '@/app/pwa-update-toaster'
import { Toaster } from '@/components/ui/sonner'

/** Renders the Link Deck start page app. */
function App() {
  return (
    <>
      <AppShell />
      <PwaUpdateToaster />
      <Toaster richColors closeButton position="top-center" />
    </>
  )
}

export default App
