const fs = require('fs-extra');
const path = require('path');

async function createSourceOnlyDeployment() {
    console.log('🚀 Création du package de déploiement CODE SOURCE SEULEMENT...');
    
    const sourceDir = '.';
    const deployDir = 'dist/fosilamaster-source-only';
    
    try {
        // Nettoyer le dossier de déploiement
        await fs.remove(deployDir);
        await fs.ensureDir(deployDir);
        
        console.log('📁 Copie du CODE SOURCE SEULEMENT...');
        
        // Fichiers de CODE SOURCE SEULEMENT (pas de build, pas de dépendances)
        const sourceOnlyFiles = [
            'package.json',
            'next.config.js',
            'tailwind.config.js',
            'tsconfig.json',
            'public/',
            'src/',
            'middleware.ts',
            'lib/',
            'components/',
            'hooks/',
            'utils/',
            'types/',
            'schemas/',
            'services/',
            'scripts/'
        ];
        
        // Copier les fichiers de code source
        for (const file of sourceOnlyFiles) {
            const sourcePath = path.join(sourceDir, file);
            const destPath = path.join(deployDir, file);
            
            if (await fs.pathExists(sourcePath)) {
                if ((await fs.stat(sourcePath)).isDirectory()) {
                    await fs.copy(sourcePath, destPath);
                } else {
                    await fs.copy(sourcePath, destPath);
                }
                console.log(`✅ Copié: ${file}`);
            }
        }
        
        // Créer le script d'installation source-only
        const installScript = `@echo off
title FosilaMaster - Installation CODE SOURCE SEULEMENT
color 0E

echo ========================================
echo    FOSILAMASTER - CODE SOURCE SEULEMENT
echo ========================================
echo.
echo 🚀 Installation depuis le code source...
echo 💡 Version ultra-légère - Code source uniquement
echo.

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Node.js n'est pas installé
    echo 💡 Veuillez installer Node.js depuis https://nodejs.org/
    echo 💡 Version recommandée: 18.x ou 20.x
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Installer les dépendances
echo 📦 Installation des dépendances...
npm install

if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo ✅ Dépendances installées
echo.

REM Construire l'application
echo 🔨 Construction de l'application...
npm run build

if errorlevel 1 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)

echo ✅ Application construite
echo.

REM Créer le lanceur source-only
echo 🚀 Création du lanceur...
echo @echo off > "Lancer FosilaMaster Source.bat"
echo title FosilaMaster Desktop - Code Source >> "Lancer FosilaMaster Source.bat"
echo color 0E >> "Lancer FosilaMaster Source.bat"
echo echo ======================================== >> "Lancer FosilaMaster Source.bat"
echo echo      FOSILAMASTER DESKTOP - SOURCE >> "Lancer FosilaMaster Source.bat"
echo echo ======================================== >> "Lancer FosilaMaster Source.bat"
echo echo. >> "Lancer FosilaMaster Source.bat"
echo echo 🚀 Démarrage de l'application... >> "Lancer FosilaMaster Source.bat"
echo echo 💡 Version code source uniquement >> "Lancer FosilaMaster Source.bat"
echo echo. >> "Lancer FosilaMaster Source.bat"
echo echo 📡 Démarrage du serveur Next.js... >> "Lancer FosilaMaster Source.bat"
echo start /B "Next.js Server" cmd /c "npm start" >> "Lancer FosilaMaster Source.bat"
echo echo. >> "Lancer FosilaMaster Source.bat"
echo echo ⏳ Attente du serveur... >> "Lancer FosilaMaster Source.bat"
echo timeout /t 5 /nobreak ^>nul >> "Lancer FosilaMaster Source.bat"
echo echo. >> "Lancer FosilaMaster Source.bat"
echo echo 🖥️ Lancement de l'interface Electron... >> "Lancer FosilaMaster Source.bat"
echo "node_modules\\.bin\\electron.cmd" . >> "Lancer FosilaMaster Source.bat"
echo echo. >> "Lancer FosilaMaster Source.bat"
echo echo 🔄 Fermeture du serveur... >> "Lancer FosilaMaster Source.bat"
echo taskkill /f /im node.exe ^>nul 2^>^&1 >> "Lancer FosilaMaster Source.bat"
echo pause >> "Lancer FosilaMaster Source.bat"

echo ✅ Lanceur créé
echo.

echo ========================================
echo           🎉 INSTALLATION TERMINÉE !
echo ========================================
echo.
echo 📱 Pour lancer l'application :
echo    Double-cliquez sur "Lancer FosilaMaster Source.bat"
echo.
echo 🌐 Accès local : http://localhost:3000
echo.
echo 💡 Code source installé avec succès !
echo.
pause
`;

        await fs.writeFile(path.join(deployDir, 'Installation CODE SOURCE.bat'), installScript);
        
        // Créer le README source-only
        const readmeContent = `# FosilaMaster - Package CODE SOURCE SEULEMENT

## 🚀 Installation depuis le code source

### 📋 Prérequis
- **Node.js** version 18.x ou 20.x (https://nodejs.org/)
- **Connexion Internet** pour télécharger les dépendances

### 🔧 Installation automatique
1. **Double-cliquez** sur \`Installation CODE SOURCE.bat\`
2. **Attendez** que l'installation se termine
3. **Lancez** l'application avec \`Lancer FosilaMaster Source.bat\`

### 📁 Fichiers inclus (CODE SOURCE SEULEMENT)
- ✅ Code source complet de l'application
- ✅ Configuration Next.js et Tailwind
- ✅ Tous les composants et services
- ✅ Scripts et utilitaires
- ✅ Scripts d'installation automatique
- ✅ Lanceur de l'application

### 🌐 Après installation
- **Accès local** : http://localhost:3000
- **Interface Electron** : Double-clic sur le lanceur
- **Serveur Next.js** : Démarrage automatique

### 💡 Avantages de la version CODE SOURCE
- **Taille ultra-réduite** (quelques MB au lieu de 8 GB)
- **Code source complet** (toutes les fonctionnalités)
- **Installation automatique** des dépendances
- **Construction automatique** de l'application
- **Lanceur prêt à l'emploi**
- **Parfait pour déploiement** sur d'autres PC

### ⚠️ Ce qui N'EST PAS inclus
- ❌ Dossier .next (build)
- ❌ Dossier node_modules (dépendances)
- ❌ Fichiers de build
- ❌ Fichiers temporaires

### 🔄 Processus d'installation
1. **Téléchargement** des dépendances (npm install)
2. **Construction** de l'application (npm run build)
3. **Création** du lanceur automatique
4. **Prêt** à l'emploi !

---
**FosilaMaster Desktop - Code Source** - Gestion scolaire professionnelle
`;

        await fs.writeFile(path.join(deployDir, 'README-CODE-SOURCE.md'), readmeContent);
        
        console.log('✅ Package CODE SOURCE SEULEMENT créé avec succès !');
        console.log(`📁 Dossier: ${deployDir}`);
        
        // Calculer la taille du package
        const size = await getDirectorySize(deployDir);
        console.log(`📊 Taille du package CODE SOURCE: ${(size / 1024 / 1024).toFixed(2)} MB`);
        
        console.log('\n🎯 Pour déployer sur un autre PC :');
        console.log('1. Copiez le dossier "fosilamaster-source-only" (très léger !)');
        console.log('2. Double-cliquez sur "Installation CODE SOURCE.bat"');
        console.log('3. Attendez la fin de l\'installation');
        console.log('4. Lancez avec "Lancer FosilaMaster Source.bat"');
        
        console.log('\n💡 AVANTAGE MAJEUR :');
        console.log('   • Votre dossier actuel : ~8 GB');
        console.log('   • Package code source : ~quelques MB');
        console.log('   • Transfert ultra-rapide !');
        console.log('   • Code source complet !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création du package code source:', error);
    }
}

async function getDirectorySize(dirPath) {
    let size = 0;
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
            size += await getDirectorySize(filePath);
        } else {
            size += stat.size;
        }
    }
    
    return size;
}

createSourceOnlyDeployment();











