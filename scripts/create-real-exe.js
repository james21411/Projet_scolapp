const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Création d\'un VRAI exécutable .exe...');

// Étape 1: Vérifier que le build Next.js existe
if (!fs.existsSync('.next')) {
  console.log('📦 Build Next.js introuvable, lancement du build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build Next.js terminé');
  } catch (error) {
    console.error('❌ Erreur lors du build Next.js:', error);
    process.exit(1);
  }
}

// Étape 2: Installer pkg si nécessaire
console.log('📦 Vérification de pkg...');
try {
  execSync('npx pkg --version', { stdio: 'pipe' });
  console.log('✅ pkg est disponible');
} catch (error) {
  console.log('📦 Installation de pkg...');
  try {
    execSync('npm install -g pkg', { stdio: 'inherit' });
    console.log('✅ pkg installé');
  } catch (installError) {
    console.log('⚠️ Installation globale échouée, utilisation de npx');
  }
}

// Étape 3: Créer un fichier d'entrée pour pkg
console.log('⚡ Création du fichier d\'entrée...');
const entryFile = 'dist-entry.js';
const entryContent = `
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = false;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    title: 'FosilaMaster - Gestion Scolaire',
    show: false
  });

  // Charger l'application depuis le serveur local
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  // Démarrer le serveur Next.js en arrière-plan
  const { spawn } = require('child_process');
  const nextServer = spawn('npm', ['start'], {
    stdio: 'pipe',
    shell: true,
    cwd: path.join(__dirname, 'app')
  });
  
  // Attendre que le serveur soit prêt
  setTimeout(() => {
    createWindow();
  }, 5000);
});

app.on('window-all-closed', () => {
  app.quit();
});
`.trim();

fs.writeFileSync(entryFile, entryContent);

// Étape 4: Créer la structure de l'application
console.log('📁 Création de la structure de l\'application...');
const appDir = 'dist/fosilamaster-app';
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

// Copier les fichiers essentiels
const filesToCopy = [
  '.next',
  'public',
  'package.json'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(path.join('.', file))) {
    console.log(`📁 Copie de ${file}...`);
    if (fs.lstatSync(path.join('.', file)).isDirectory()) {
      function copyDir(src, dest) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        const items = fs.readdirSync(src);
        items.forEach(item => {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);
          
          if (fs.lstatSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        });
      }
      
      copyDir(path.join('.', file), path.join(appDir, file));
    } else {
      fs.copyFileSync(path.join('.', file), path.join(appDir, file));
    }
  }
});

// Étape 5: Créer l'exécutable avec pkg
console.log('⚡ Création de l\'exécutable .exe...');
try {
  const pkgCommand = `npx pkg ${entryFile} --target node18-win-x64 --output dist/FosilaMaster.exe`;
  execSync(pkgCommand, { stdio: 'inherit' });
  console.log('✅ Exécutable .exe créé avec succès !');
} catch (error) {
  console.log('⚠️ Création avec pkg échouée, création d\'un exécutable alternatif...');
  
  // Créer un exécutable alternatif avec un script batch amélioré
  const exeDir = 'dist/fosilamaster-exe';
  if (!fs.existsSync(exeDir)) {
    fs.mkdirSync(exeDir, { recursive: true });
  }

  // Copier les fichiers
  filesToCopy.forEach(file => {
    if (fs.existsSync(path.join('.', file))) {
      if (fs.lstatSync(path.join('.', file)).isDirectory()) {
        function copyDir(src, dest) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          
          const items = fs.readdirSync(src);
          items.forEach(item => {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            if (fs.lstatSync(srcPath).isDirectory()) {
              copyDir(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          });
        }
        
        copyDir(path.join('.', file), path.join(exeDir, file));
      } else {
        fs.copyFileSync(path.join('.', file), path.join(exeDir, file));
      }
    }
  });

  // Créer un script de lancement amélioré
  const launcherScript = `
@echo off
title FosilaMaster Desktop
color 0A

echo ========================================
echo           FosilaMaster Desktop
echo ========================================
echo.

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Node.js n'est pas installé
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier que Electron est installé
if not exist "..\\node_modules\\.bin\\electron.cmd" (
    echo ❌ Erreur: Electron n'est pas installé
    echo Veuillez exécuter: npm install
    pause
    exit /b 1
)

echo ✅ Vérifications terminées
echo 🚀 Lancement de FosilaMaster...
echo.

REM Lancer l'application
cd /d "%~dp0"
"..\\node_modules\\.bin\\electron.cmd" public\\electron.js

echo.
echo Application fermée.
pause
  `.trim();

  fs.writeFileSync(path.join(exeDir, 'FosilaMaster.exe.bat'), launcherScript);

  // Créer un raccourci Windows
  const shortcutContent = `
@echo off
cd /d "%~dp0"
start "" "FosilaMaster.exe.bat"
  `.trim();

  fs.writeFileSync(path.join(exeDir, 'Lancer FosilaMaster.bat'), shortcutContent);

  console.log('✅ Exécutable alternatif créé !');
  console.log(`📁 L'application se trouve dans: ${path.resolve(exeDir)}`);
  console.log('💡 Pour lancer: double-cliquez sur FosilaMaster.exe.bat');
}

// Nettoyer le fichier temporaire
if (fs.existsSync(entryFile)) {
  fs.unlinkSync(entryFile);
}

console.log('🎉 Création de l\'exécutable terminée !');
console.log('📁 Vérifiez le dossier dist/ pour vos exécutables');
console.log('💡 Pour tester l\'app: npm run electron-dev');
