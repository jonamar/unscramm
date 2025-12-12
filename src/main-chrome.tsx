import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { chromePlatform } from './platform/chrome'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App platform={chromePlatform} />
  </StrictMode>,
)
