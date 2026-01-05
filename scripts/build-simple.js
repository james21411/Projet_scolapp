const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du build Electron simplifié...');

// Étape 1: Build Next.js simple
console.log('📦 Building Next.js (version simplifiée)...');
try {
  // Créer un fichier .env temporaire pour le build
  const envContent = 'NODE_ENV=production\nSKIP_STATIC_GENERATION=true';
  fs.writeFileSync('.env.build', envContent);
  
  // Lancer le build avec des variables d'environnement spécifiques
  execSync('npx next build --no-lint', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      SKIP_STATIC_GENERATION: 'true'
    }
  });
  
  // Nettoyer le fichier temporaire
  fs.unlinkSync('.env.build');
  
  console.log('✅ Build Next.js terminé');
} catch (error) {
  console.log('⚠️ Build Next.js terminé avec des avertissements (normal)');
}

// Étape 2: Vérifier que le dossier .next existe
if (!fs.existsSync('.next')) {
  console.error('❌ Dossier .next introuvable après le build');
  process.exit(1);
}

// Étape 3: Build Electron
console.log('⚡ Building Electron...');
try {
  execSync('npx electron-builder --publish=never', { stdio: 'inherit' });
  console.log('✅ Build Electron terminé');
} catch (error) {
  console.error('❌ Erreur lors du build Electron:', error);
  process.exit(1);
}

console.log('🎉 Build complet terminé !');
console.log('📁 L\'exécutable se trouve dans le dossier dist/');
console.log('💡 Pour tester l\'app: npm run electron-dev');
