const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du build Electron minimal...');

// Étape 1: Créer un build Next.js minimal
console.log('📦 Création d\'un build Next.js minimal...');
try {
  // Créer le dossier .next s'il n'existe pas
  if (!fs.existsSync('.next')) {
    fs.mkdirSync('.next', { recursive: true });
  }
  
  // Créer un fichier de build minimal
  const buildInfo = {
    version: '1.0.0',
    buildTime: new Date().toISOString(),
    type: 'minimal'
  };
  
  fs.writeFileSync('.next/build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log('✅ Build minimal créé');
  
} catch (error) {
  console.log('⚠️ Erreur lors de la création du build minimal:', error.message);
}

// Étape 2: Build Electron
console.log('⚡ Building Electron...');
try {
  execSync('npx electron-builder --publish=never', { stdio: 'inherit' });
  console.log('✅ Build Electron terminé');
} catch (error) {
  console.error('❌ Erreur lors du build Electron:', error);
  process.exit(1);
}

console.log('🎉 Build minimal terminé !');
console.log('📁 L\'exécutable se trouve dans le dossier dist/');
console.log('💡 Pour tester l\'app: npm run electron-dev');
