import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureIdentity } from './auth/identity'
import { registerWorkspaceServiceWorker } from './services/workspaceServiceWorker'

// Stable per-browser identity before any API calls (cookie `user_id`).
ensureIdentity()

void registerWorkspaceServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
