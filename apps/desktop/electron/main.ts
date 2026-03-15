import { app, BrowserWindow, ipcMain, Menu, protocol, net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { getSteamUser, getSteamAuthTicket } from './steam';

const RENDERER_DIR = path.join(__dirname, '../renderer');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  Menu.setApplicationMenu(null);

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadURL('app://./index.html');
  }
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    const filePath = path.join(RENDERER_DIR, decodeURIComponent(pathname));
    return net.fetch(pathToFileURL(filePath).toString());
  });

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
