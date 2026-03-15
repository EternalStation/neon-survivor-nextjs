import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  getSteamUser: () => ipcRenderer.invoke('get-steam-user'),
  getSteamAuthTicket: () => ipcRenderer.invoke('get-steam-auth-ticket'),
});

window.addEventListener('error', (event) => {
  ipcRenderer.send('console-error', event.error ? event.error.stack : event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  ipcRenderer.send('console-error', event.reason ? event.reason.stack || event.reason : 'Unhandled Promise Rejection');
});
