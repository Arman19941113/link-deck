import { AppShell } from '@/app/app-shell'
import { Toaster } from '@/components/ui/sonner'

/** Renders the Link Deck start page app. */
function App() {
  return (
    <>
      <AppShell />
      <Toaster richColors closeButton position="top-center" />
    </>
  )
}

export default App
