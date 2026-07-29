const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Création d\'un exécutable Electron local...');

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

// Étape 2: Créer un exécutable simple
console.log('⚡ Création de l\'exécutable...');
try {
  // Créer le dossier dist s'il n'existe pas
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Créer la structure de l'exécutable
  const exeDir = 'dist/fosilamaster-executable';
  if (!fs.existsSync(exeDir)) {
    fs.mkdirSync(exeDir, { recursive: true });
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
        // Copier récursivement avec fs
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

  // Créer un script de lancement avec Electron local
  const launcherScript = `
@echo off
echo ========================================
echo           FosilaMaster Desktop
echo ========================================
echo.
echo Lancement de l'application...
echo.

REM Vérifier que Electron est installé
if not exist "..\\node_modules\\.bin\\electron.cmd" (
    echo Erreur: Electron n'est pas installé
    echo Veuillez exécuter: npm install
    pause
    exit /b 1
)

REM Lancer l'application
cd /d "%~dp0"
"..\\node_modules\\.bin\\electron.cmd" public\\electron.js

echo.
echo Application fermée.
pause
  `.trim();

  fs.writeFileSync(path.join(exeDir, 'FosilaMaster.bat'), launcherScript);

  // Créer un fichier README
  const readmeContent = `
# FosilaMaster - Exécutable Local

## 🚀 Lancement rapide

Double-cliquez sur \`FosilaMaster.bat\` pour démarrer l'application !

## 📋 Prérequis

- Node.js installé sur votre système
- Les dépendances installées dans le dossier parent (\`npm install\`)

## 🔧 Structure

- \`.next\` - Application Next.js compilée
- \`public\` - Fichiers publics et Electron
- \`package.json\` - Configuration
- \`FosilaMaster.bat\` - Lanceur principal

## 💡 Utilisation

1. Assurez-vous que \`npm install\` a été exécuté dans le dossier parent
2. Double-cliquez sur \`FosilaMaster.bat\`
3. L'application se lance dans une fenêtre Electron

## 🐛 Dépannage

Si l'application ne se lance pas :
1. Vérifiez que Node.js est installé
2. Exécutez \`npm install\` dans le dossier parent
3. Vérifiez que le dossier \`node_modules\` existe
  `.trim();

  fs.writeFileSync(path.join(exeDir, 'README.md'), readmeContent);

  // Créer un raccourci Windows
  const shortcutContent = `
@echo off
cd /d "%~dp0"
start "" "FosilaMaster.bat"
  `.trim();

  fs.writeFileSync(path.join(exeDir, 'Lancer FosilaMaster.bat'), shortcutContent);

  console.log('✅ Exécutable Electron créé avec succès !');
  console.log(`📁 L'exécutable se trouve dans: ${path.resolve(exeDir)}`);
  console.log('💡 Pour lancer: double-cliquez sur FosilaMaster.bat');
  console.log('⚠️  Assurez-vous que node_modules est installé dans le dossier parent');

} catch (error) {
  console.error('❌ Erreur lors de la création de l\'exécutable:', error);
  process.exit(1);
}

console.log('🎉 Création de l\'exécutable terminée !');
console.log('💡 Pour tester l\'app: npm run electron-dev');
