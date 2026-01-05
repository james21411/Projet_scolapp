const fs = require('fs-extra');
const path = require('path');

async function createMinimalDeployment() {
    console.log('🚀 Création du package de déploiement MINIMAL ScolApp...');
    
    const sourceDir = '.';
    const deployDir = 'dist/scolapp-minimal';
    
    try {
        // Nettoyer le dossier de déploiement
        await fs.remove(deployDir);
        await fs.ensureDir(deployDir);
        
        console.log('📁 Copie des fichiers MINIMAUX...');
        
        // Fichiers MINIMAUX pour déploiement
        const minimalFiles = [
            'package.json',
            'next.config.js',
            'tailwind.config.js',
            'tsconfig.json',
            'public/',
            'src/app/',
            'src/components/ui/',
            'src/lib/',
            'src/types/',
            'src/schemas/',
            'src/services/',
            'middleware.ts'
        ];
        
        // Copier les fichiers minimaux
        for (const file of minimalFiles) {
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
        
        // Créer le script d'installation minimal
        const installScript = `@echo off
title ScolApp - Installation MINIMALE
color 0C

echo ========================================
echo        SCOLAPP - DÉPLOIEMENT MINIMAL
echo ========================================
echo.
echo 🚀 Installation minimale de ScolApp...
echo 💡 Version ultra-légère pour déploiement rapide
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
npm install --production

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

REM Créer le lanceur minimal
echo 🚀 Création du lanceur minimal...
echo @echo off > "Lancer ScolApp Minimal.bat"
echo title ScolApp Desktop - Version Minimale >> "Lancer ScolApp Minimal.bat"
echo color 0C >> "Lancer ScolApp Minimal.bat"
echo echo ======================================== >> "Lancer ScolApp Minimal.bat"
echo echo      SCOLAPP DESKTOP - MINIMAL >> "Lancer ScolApp Minimal.bat"
echo echo ======================================== >> "Lancer ScolApp Minimal.bat"
echo echo. >> "Lancer ScolApp Minimal.bat"
echo echo 🚀 Démarrage de l'application... >> "Lancer ScolApp Minimal.bat"
echo echo 💡 Version minimale pour déploiement rapide >> "Lancer ScolApp Minimal.bat"
echo echo. >> "Lancer ScolApp Minimal.bat"
echo echo 📡 Démarrage du serveur Next.js... >> "Lancer ScolApp Minimal.bat"
echo start /B "Next.js Server" cmd /c "npm start" >> "Lancer ScolApp Minimal.bat"
echo echo. >> "Lancer ScolApp Minimal.bat"
echo echo ⏳ Attente du serveur... >> "Lancer ScolApp Minimal.bat"
echo timeout /t 5 /nobreak ^>nul >> "Lancer ScolApp Minimal.bat"
echo echo. >> "Lancer ScolApp Minimal.bat"
echo echo 🖥️ Lancement de l'interface Electron... >> "Lancer ScolApp Minimal.bat"
echo "node_modules\\.bin\\electron.cmd" . >> "Lancer ScolApp Minimal.bat"
echo echo. >> "Lancer ScolApp Minimal.bat"
echo echo 🔄 Fermeture du serveur... >> "Lancer ScolApp Minimal.bat"
echo taskkill /f /im node.exe ^>nul 2^>^&1 >> "Lancer ScolApp Minimal.bat"
echo pause >> "Lancer ScolApp Minimal.bat"

echo ✅ Lanceur minimal créé
echo.

echo ========================================
echo           🎉 DÉPLOIEMENT MINIMAL TERMINÉ !
echo ========================================
echo.
echo 📱 Pour lancer l'application :
echo    Double-cliquez sur "Lancer ScolApp Minimal.bat"
echo.
echo 🌐 Accès local : http://localhost:3000
echo.
echo 💡 Version ultra-légère prête à utiliser !
echo.
pause
`;

        await fs.writeFile(path.join(deployDir, 'Installation MINIMALE.bat'), installScript);
        
        // Créer le README minimal
        const readmeContent = `# ScolApp - Package de Déploiement MINIMAL

## 🚀 Installation MINIMALE sur un nouvel ordinateur

### 📋 Prérequis
- **Node.js** version 18.x ou 20.x (https://nodejs.org/)
- **Connexion Internet** pour télécharger les dépendances

### 🔧 Installation automatique
1. **Double-cliquez** sur \`Installation MINIMALE.bat\`
2. **Attendez** que l'installation se termine
3. **Lancez** l'application avec \`Lancer ScolApp Minimal.bat\`

### 📁 Fichiers inclus (VERSION MINIMALE)
- ✅ Code source essentiel uniquement
- ✅ Configuration Next.js et Tailwind
- ✅ Composants UI de base
- ✅ Services principaux
- ✅ Scripts d'installation automatique
- ✅ Lanceur de l'application

### 🌐 Après installation
- **Accès local** : http://localhost:3000
- **Interface Electron** : Double-clic sur le lanceur
- **Serveur Next.js** : Démarrage automatique

### 💡 Avantages de la version MINIMALE
- **Taille ultra-réduite** (quelques MB au lieu de 8 GB)
- **Installation rapide** des dépendances
- **Construction automatique** de l'application
- **Lanceur prêt à l'emploi**
- **Parfait pour déploiement** sur d'autres PC

### ⚠️ Différences avec la version complète
- Moins de composants avancés
- Fonctionnalités de base uniquement
- Idéal pour utilisation en production

---
**ScolApp Desktop Minimal** - Gestion scolaire professionnelle
`;

        await fs.writeFile(path.join(deployDir, 'README-MINIMAL.md'), readmeContent);
        
        console.log('✅ Package de déploiement MINIMAL créé avec succès !');
        console.log(`📁 Dossier: ${deployDir}`);
        
        // Calculer la taille du package
        const size = await getDirectorySize(deployDir);
        console.log(`📊 Taille du package MINIMAL: ${(size / 1024 / 1024).toFixed(2)} MB`);
        
        console.log('\n🎯 Pour déployer sur un autre PC :');
        console.log('1. Copiez le dossier "scolapp-minimal" (très léger !)');
        console.log('2. Double-cliquez sur "Installation MINIMALE.bat"');
        console.log('3. Attendez la fin de l\'installation');
        console.log('4. Lancez avec "Lancer ScolApp Minimal.bat"');
        
        console.log('\n💡 AVANTAGE MAJEUR :');
        console.log('   • Votre dossier actuel : ~8 GB');
        console.log('   • Package de déploiement : ~quelques MB');
        console.log('   • Transfert ultra-rapide !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création du package minimal:', error);
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

createMinimalDeployment();











