import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('sapay', {
  getConfig: () =>
    ipcRenderer.invoke('sapay:config') as Promise<{ apiUrl: string }>
});
