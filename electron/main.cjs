const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// LCMS PRO Desktop (Electron) main process.
// This starts the bundled Express server (dist/server.cjs) on a local port,
// then opens a native window pointed at it. No application logic is changed.

const PORT = process.env.LCMS_DESKTOP_PORT || 4173;
let serverProcess;
let mainWindow;

function startServer() {
  const serverPath = path.join(__dirname, '..', 'dist', 'server.cjs');
  serverProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
    windowsHide: true,
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'LCMS PRO - Lightway Cooperative Management System',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links in the OS browser instead of inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Give the local server a moment to boot, then load it.
  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }, 800);
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
