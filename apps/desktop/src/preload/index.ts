import { contextBridge, ipcRenderer } from 'electron';

export type AssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AssistantPageContext = {
  pageName: string;
  userRole: 'ADMIN' | 'RECEPTION';
  appName: string;
  pageSummary: string;
};

contextBridge.exposeInMainWorld('sapay', {
  getConfig: () =>
    ipcRenderer.invoke('sapay:config') as Promise<{ apiUrl: string }>,

  askAssistant: (payload: {
    messages: AssistantChatMessage[];
    pageContext: AssistantPageContext;
  }) => ipcRenderer.invoke('sapay:assistant', payload) as Promise<string>
});