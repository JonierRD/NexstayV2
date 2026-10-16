import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { applyStoredTheme, ensureInitialTheme } from './lib/theme';

async function bootstrap(): Promise<void> {
  // Usa el tema local y no bloquea el primer render por la disponibilidad de la API.
  applyStoredTheme();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  void ensureInitialTheme();
}

void bootstrap();
