import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { applyTheme, getStoredTheme } from '@/lib/theme';
import '@/lib/i18n';
import '@/styles/index.css';

applyTheme(getStoredTheme());

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
