// Superficie que el proceso main expone al renderer a través del preload.
// Única declaración global de `window.sapay`: cualquier otro archivo que necesite
// tipar un puente IPC debe importar estos tipos, no redeclarar la interfaz.
export {};

declare global {
  interface Window {
    sapay?: {
      getConfig: () => Promise<{ apiUrl: string }>;
      askAssistant: (payload: {
        messages: Array<{ role: 'user' | 'assistant'; content: string }>;
        pageContext: {
          pageName: string;
          userRole: 'ADMIN' | 'RECEPTION' | 'CLEANING';
          appName: string;
          pageSummary: string;
        };
      }) => Promise<string>;
    };
  }
}