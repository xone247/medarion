import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[Global Error Handler]', event.error || event.message, event);
  // Prevent default error handling if needed
  // event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  // Prevent default error handling if needed
  // event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);