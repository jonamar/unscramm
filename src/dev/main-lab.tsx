import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AnimationLab from './AnimationLab';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnimationLab />
  </StrictMode>
);
