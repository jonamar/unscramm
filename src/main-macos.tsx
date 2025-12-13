import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { macosPlatform } from './platform/macos';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App platform={macosPlatform} />
  </StrictMode>
);
