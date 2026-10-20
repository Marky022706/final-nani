import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ActionLoadingProvider } from './context/ActionLoadingContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ActionLoadingProvider>
      <App />
    </ActionLoadingProvider>
  </StrictMode>,
)

