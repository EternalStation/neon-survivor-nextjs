import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import path from 'path';
import { getSteamUser, getSteamAuthTicket } from './steam';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('toggle-fullscreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;
    const isFull = win.isFullScreen();
    win.setFullScreen(!isFull);
    return !isFull;
  });

  ipcMain.handle('get-steam-user', getSteamUser);
  ipcMain.handle('get-steam-auth-ticket', getSteamAuthTicket);

  ipcMain.on('console-error', (event, err) => {
    console.error('--- RENDERER ERROR ---', err);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
