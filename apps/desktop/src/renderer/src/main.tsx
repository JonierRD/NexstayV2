import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { applyStoredTheme, ensureInitialTheme } from './lib/theme';

async function bootstrap(): Promise<void> {
  // Aplica el tema local al instante y luego lo confirma contra el servidor.
  applyStoredTheme();
  await ensureInitialTheme();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
