import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

// Ignorar AbortError globalmente para evitar Unhandled Promise Rejection
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as { name?: string; message?: string } | null;
  if (reason?.name === 'AbortError' || reason?.message?.includes('aborted')) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
