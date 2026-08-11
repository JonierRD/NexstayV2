import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('sapay', {
  appName: 'SAPAY Hotel',
  getConfig: () =>
    ipcRenderer.invoke('sapay:config') as Promise<{ apiUrl: string; appName: string }>
});
