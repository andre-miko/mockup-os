import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Shell } from '@shell/Shell';
import { AppRouter } from './Router';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <Shell>
        <AppRouter />
      </Shell>
    </BrowserRouter>
  </StrictMode>,
);
