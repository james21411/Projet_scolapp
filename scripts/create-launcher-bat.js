const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Création d\'un lanceur .bat pour FosilaMaster...');

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

// Étape 2: Créer le dossier dist s'il n'existe pas
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Étape 3: Créer le lanceur principal
const launcherDir = 'dist/fosilamaster-launcher';
if (!fs.existsSync(launcherDir)) {
  fs.mkdirSync(launcherDir, { recursive: true });
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
      
      copyDir(path.join('.', file), path.join(launcherDir, file));
    } else {
      fs.copyFileSync(path.join('.', file), path.join(launcherDir, file));
    }
  }
});

// Créer le lanceur principal
const launcherScript = `
@echo off
title FosilaMaster Desktop - Lanceur
color 0A

echo ========================================
echo           FosilaMaster Desktop
echo ========================================
echo.
echo 🚀 Démarrage de l'application...
echo.

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Node.js n'est pas installé
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier qu'Electron est installé (dans le dossier racine du projet)
if not exist "..\\..\\node_modules\\.bin\\electron.cmd" (
    echo ❌ Erreur: Electron n'est pas installé
    echo Veuillez exécuter: npm install
    pause
    exit /b 1
)

echo ✅ Vérifications terminées
echo.
echo 📡 Démarrage du serveur Next.js...
echo.

REM Aller dans le dossier racine du projet pour lancer le serveur
cd /d "..\\.."

REM Démarrer le serveur Next.js en arrière-plan avec wait-on
start /B "Next.js Server" cmd /c "npm run dev"

REM Attendre que le serveur soit prêt (comme wait-on)
echo ⏳ Attente du démarrage du serveur...
:wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ⏳ Serveur en cours de démarrage...
    goto wait_loop
)

echo 🌐 Serveur démarré sur http://localhost:3000
echo.
echo 🖥️  Lancement de l'interface Electron...
echo.

REM Lancer l'application Electron (depuis le dossier racine)
"node_modules\\.bin\\electron.cmd" .

echo.
echo 🔄 Fermeture du serveur...
echo.

REM Fermer le serveur Next.js
taskkill /f /im node.exe >nul 2>&1

echo ✅ Application fermée avec succès !
pause
`.trim();

fs.writeFileSync(path.join(launcherDir, 'Lancer FosilaMaster.bat'), launcherScript);

// Créer un lanceur rapide
const quickLauncherScript = `
@echo off
cd /d "%~dp0"
start "" "Lancer FosilaMaster.bat"
`.trim();

fs.writeFileSync(path.join(launcherDir, '🚀 Lancer FosilaMaster.bat'), quickLauncherScript);

// Créer un lanceur alternatif qui utilise concurrently
const launcherConcurrentScript = `
@echo off
title FosilaMaster Desktop - Lanceur Concurrent
color 0B

echo ========================================
echo           FosilaMaster Desktop
echo ========================================
echo.
echo 🚀 Démarrage avec concurrently (comme npm run electron-dev)...
echo.

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Node.js n'est pas installé
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier qu'Electron est installé
if not exist "..\\..\\node_modules\\.bin\\electron.cmd" (
    echo ❌ Erreur: Electron n'est pas installé
    echo Veuillez exécuter: npm install
    pause
    exit /b 1
)

echo ✅ Vérifications terminées
echo.
echo 📡 Lancement avec concurrently...
echo.

REM Aller dans le dossier racine du projet
cd /d "..\\.."

REM Lancer exactement comme npm run electron-dev
"node_modules\\.bin\\concurrently.cmd" "npm run dev" "wait-on http://localhost:3000 && electron ."

echo.
echo ✅ Application fermée !
pause
`.trim();

fs.writeFileSync(path.join(launcherDir, 'Lancer FosilaMaster Concurrent.bat'), launcherConcurrentScript);

// Créer un fichier README
const readmeContent = `
# FosilaMaster - Lanceur Desktop

## 🚀 Lancement rapide

**Double-cliquez sur :** \`Lancer FosilaMaster.bat\`

## 📋 Ce que fait le lanceur

1. ✅ Vérifie que Node.js est installé
2. ✅ Vérifie qu'Electron est installé  
3. 📡 Démarre le serveur Next.js en arrière-plan
4. 🖥️  Lance l'interface Electron
5. 🔄 Ferme automatiquement le serveur à la fermeture

## 🔧 Prérequis

- Node.js installé sur votre système
- Les dépendances installées dans le dossier parent (\`npm install\`)

## 📁 Structure

- \`.next\` - Application Next.js compilée
- \`public\` - Fichiers publics et Electron
- \`package.json\` - Configuration
- \`Lancer FosilaMaster.bat\` - Lanceur principal
- \`🚀 Lancer FosilaMaster.bat\` - Raccourci

## 💡 Utilisation

1. Assurez-vous que \`npm install\` a été exécuté dans le dossier parent
2. Double-cliquez sur \`Lancer FosilaMaster.bat\`
3. L'application se lance automatiquement !

## 🐛 Dépannage

Si l'application ne se lance pas :
1. Vérifiez que Node.js est installé
2. Exécutez \`npm install\` dans le dossier parent
3. Vérifiez que le dossier \`node_modules\` existe
4. Vérifiez que le port 3000 n'est pas utilisé par une autre application
`.trim();

fs.writeFileSync(path.join(launcherDir, 'README.md'), readmeContent);

// Créer un script de test
const testScript = `
@echo off
echo Test de connexion au serveur Next.js...
echo.
echo Tentative de connexion à http://localhost:3000...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ❌ Serveur non accessible
    echo Vérifiez que le serveur Next.js est démarré
) else (
    echo ✅ Serveur accessible
)
echo.
pause
`.trim();

fs.writeFileSync(path.join(launcherDir, 'Test Serveur.bat'), testScript);

console.log('✅ Lanceur .bat créé avec succès !');
console.log(`📁 Le lanceur se trouve dans: ${path.resolve(launcherDir)}`);
console.log('💡 Pour lancer: double-cliquez sur "Lancer FosilaMaster.bat"');
console.log('⚠️  Assurez-vous que node_modules est installé dans le dossier parent');

console.log('\n🎉 Création du lanceur terminée !');
console.log('📁 Vérifiez le dossier dist/fosilamaster-launcher/');
console.log('💡 Pour tester l\'app: npm run electron-dev');
