import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './app/app.tsx'
import { localAppCacheService } from '@/services/local-app-cache'
import { applyAppearancePreference } from '@/services/theme'

applyAppearancePreference(localAppCacheService.getThemePreference(), localAppCacheService.getDesignStylePreference())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
