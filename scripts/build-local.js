const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du build Electron local...');

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

// Étape 2: Créer un package Electron local
console.log('⚡ Création du package Electron local...');
try {
  // Créer le dossier dist s'il n'existe pas
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Copier les fichiers nécessaires
  const sourceDir = '.';
  const targetDir = 'dist/scolapp';

  // Créer la structure
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copier les fichiers essentiels
  const filesToCopy = [
    '.next',
    'node_modules',
    'public',
    'package.json'
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(path.join(sourceDir, file))) {
      console.log(`📁 Copie de ${file}...`);
      if (fs.lstatSync(path.join(sourceDir, file)).isDirectory()) {
        // Copier le dossier
        execSync(`xcopy "${path.join(sourceDir, file)}" "${path.join(targetDir, file)}" /E /I /Y`, { shell: true });
      } else {
        // Copier le fichier
        fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
      }
    }
  });

  // Créer un script de lancement
  const launcherScript = `
@echo off
cd /d "%~dp0"
npm start
  `.trim();

  fs.writeFileSync(path.join(targetDir, 'launch.bat'), launcherScript);

  console.log('✅ Package Electron local créé avec succès !');
  console.log(`📁 L'application se trouve dans: ${path.resolve(targetDir)}`);
  console.log('💡 Pour lancer: double-cliquez sur launch.bat');

} catch (error) {
  console.error('❌ Erreur lors de la création du package:', error);
  process.exit(1);
}

console.log('🎉 Build local terminé !');
console.log('💡 Pour tester l\'app: npm run electron-dev');
