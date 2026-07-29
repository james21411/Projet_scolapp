const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let nextServer = null;

function startNextServer() {
  if (!isDev) {
    console.log('🚀 Démarrage du serveur Next.js...');
    nextServer = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true
    });
    
    nextServer.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
    });
    
    nextServer.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });
    
    // Attendre que le serveur soit prêt
    setTimeout(() => {
      console.log('✅ Serveur Next.js démarré');
    }, 5000);
  }
}

function createWindow() {
  // Créer la fenêtre du navigateur
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    title: 'FosilaMaster - Gestion Scolaire',
    show: false // Ne pas afficher immédiatement
  });

  // Charger l'application
  if (isDev) {
    // En mode développement, charger depuis le serveur de développement Next.js
    mainWindow.loadURL('http://localhost:3000');
    // NE PAS ouvrir automatiquement les outils de développement
    // mainWindow.webContents.openDevTools();
  } else {
    // En production, charger depuis le serveur Next.js local
    mainWindow.loadURL('http://localhost:3000');
  }

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    if (nextServer) {
      nextServer.kill();
    }
    app.quit();
  });
}

// Quand Electron est prêt
app.whenReady().then(() => {
  startNextServer();
  createWindow();
});

// Quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextServer) {
      nextServer.kill();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gérer la fermeture propre
app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill();
  }
}); 