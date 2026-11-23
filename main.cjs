const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      // The renderer is pure React + Three.js and uses no Node API at
      // all -- no require(), no process, no ipcRenderer. Node access was
      // enabled for convenience, but it means any script that ends up in
      // the page (including anything pulled in by a dependency) can read
      // the filesystem and run commands. Turning it off costs nothing.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
    show: false, // Don't show until ready to prevent flickering
  });

  // Remove the default top menu (File, Edit, View, etc) to look like a game
  Menu.setApplicationMenu(null);

  // Load the built Vite index.html file
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  // Show window gracefully
  mainWindow.once('ready-to-show', () => {
    mainWindow.setFullScreen(true);
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
