import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/app.tsx'
import { localAppCacheService } from '@/services/local-app-cache'
import { applyThemePreference } from '@/services/theme'

applyThemePreference(localAppCacheService.getThemePreference())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
