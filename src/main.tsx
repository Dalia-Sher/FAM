import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');

try {
  if (!rootEl) throw new Error('root element missing');
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (rootEl) {
    rootEl.innerHTML = `<div dir="rtl" style="padding:1.5rem;font-family:sans-serif;color:#8b3a3a">
      <h1>שגיאה בטעינת האפליקציה</h1>
      <p>${message}</p>
    </div>`;
  }
  console.error(err);
}
