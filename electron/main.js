const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  // Créer la fenêtre du navigateur
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Optionnel
    title: 'ScolApp - Gestion Scolaire'
  });

  // Charger l'application
  if (isDev) {
    // En mode développement, charger depuis le serveur de développement Next.js
    mainWindow.loadURL('http://localhost:3000');
    // Ouvrir les outils de développement
    mainWindow.webContents.openDevTools();
  } else {
    // En production, charger depuis le build
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// Quand Electron est prêt
app.whenReady().then(createWindow);

// Quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 