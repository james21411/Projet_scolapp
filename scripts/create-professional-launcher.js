const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Création d\'un lanceur professionnel pour FosilaMaster...');

// Fonction pour obtenir l'IP locale
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return '127.0.0.1';
}

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

// Étape 3: Créer le lanceur professionnel
const launcherDir = 'dist/fosilamaster-professional';
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

// Obtenir l'IP locale
const localIP = getLocalIP();
console.log('🌐 IP locale détectée:', localIP);
