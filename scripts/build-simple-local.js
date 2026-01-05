const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du build Electron local simplifié...');

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

// Étape 2: Créer un package Electron local simplifié
console.log('⚡ Création du package Electron local simplifié...');
try {
  // Créer le dossier dist s'il n'existe pas
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Créer la structure
  const targetDir = 'dist/scolapp';
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copier seulement les fichiers essentiels (pas node_modules)
  const filesToCopy = [
    '.next',
    'public',
    'package.json'
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(path.join('.', file))) {
      console.log(`📁 Copie de ${file}...`);
      if (fs.lstatSync(path.join('.', file)).isDirectory()) {
        // Copier le dossier avec une méthode plus simple
        const targetPath = path.join(targetDir, file);
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        
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
        
        copyDir(path.join('.', file), path.join(targetDir, file));
      } else {
        // Copier le fichier
        fs.copyFileSync(path.join('.', file), path.join(targetDir, file));
      }
    }
  });

  // Créer un script de lancement
  const launcherScript = `
@echo off
echo Lancement de ScolApp...
echo.
echo Note: Assurez-vous que node_modules est installé dans le dossier parent
echo.
cd /d "%~dp0\\.."
npm start
pause
  `.trim();

  fs.writeFileSync(path.join(targetDir, 'launch.bat'), launcherScript);

  // Créer un fichier README
  const readmeContent = `
# ScolApp - Package Local

## Installation

1. Assurez-vous que Node.js est installé
2. Dans le dossier parent, exécutez: \`npm install\`
3. Double-cliquez sur \`launch.bat\` pour démarrer l'application

## Structure

- \`.next\` - Build Next.js
- \`public\` - Fichiers publics
- \`package.json\` - Configuration du projet
- \`launch.bat\` - Script de lancement

## Dépendances

Le dossier \`node_modules\` doit être présent dans le dossier parent.
  `.trim();

  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent);

  console.log('✅ Package Electron local créé avec succès !');
  console.log(`📁 L'application se trouve dans: ${path.resolve(targetDir)}`);
  console.log('💡 Pour lancer: double-cliquez sur launch.bat');
  console.log('⚠️  Assurez-vous que node_modules est installé dans le dossier parent');

} catch (error) {
  console.error('❌ Erreur lors de la création du package:', error);
  process.exit(1);
}

console.log('🎉 Build local simplifié terminé !');
console.log('💡 Pour tester l\'app: npm run electron-dev');
