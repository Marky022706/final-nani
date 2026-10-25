import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ActionLoadingProvider } from './context/ActionLoadingContext'
import { PageTransitionProvider } from './context/PageTransitionContext'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ActionLoadingProvider>
        <PageTransitionProvider>
          <App />
        </PageTransitionProvider>
      </ActionLoadingProvider>
    </ThemeProvider>
  </StrictMode>,
)

