const fs = require('fs-extra');
const path = require('path');

async function createDeploymentPackage() {
    console.log('🚀 Création du package de déploiement FosilaMaster...');
    
    const sourceDir = '.';
    const deployDir = 'dist/fosilamaster-deployment';
    
    try {
        // Nettoyer le dossier de déploiement
        await fs.remove(deployDir);
        await fs.ensureDir(deployDir);
        
        console.log('📁 Copie des fichiers essentiels...');
        
        // Fichiers de configuration essentiels
        const essentialFiles = [
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
            'services/'
        ];
        
        // Copier les fichiers essentiels
        for (const file of essentialFiles) {
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
        
        // Créer le script d'installation
        const installScript = `@echo off
title FosilaMaster - Installation et Déploiement
color 0A

echo ========================================
echo           FOSILAMASTER - DÉPLOIEMENT
echo ========================================
echo.
echo 🚀 Installation et déploiement de FosilaMaster...
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

REM Créer le lanceur
echo 🚀 Création du lanceur...
echo @echo off > "Lancer FosilaMaster.bat"
echo title FosilaMaster Desktop >> "Lancer FosilaMaster.bat"
echo color 0A >> "Lancer FosilaMaster.bat"
echo. >> "Lancer FosilaMaster.bat"
echo echo ======================================== >> "Lancer FosilaMaster.bat"
echo echo           FOSILAMASTER DESKTOP >> "Lancer FosilaMaster.bat"
echo echo ======================================== >> "Lancer FosilaMaster.bat"
echo echo. >> "Lancer FosilaMaster.bat"
echo echo 🚀 Démarrage de l'application... >> "Lancer FosilaMaster.bat"
echo echo. >> "Lancer FosilaMaster.bat"
echo echo 📡 Démarrage du serveur Next.js... >> "Lancer FosilaMaster.bat"
echo start /B "Next.js Server" cmd /c "npm start" >> "Lancer FosilaMaster.bat"
echo echo. >> "Lancer FosilaMaster.bat"
echo echo ⏳ Attente du serveur... >> "Lancer FosilaMaster.bat"
echo timeout /t 5 /nobreak ^>nul >> "Lancer FosilaMaster.bat"
echo echo. >> "Lancer FosilaMaster.bat"
echo echo 🖥️ Lancement de l'interface Electron... >> "Lancer FosilaMaster.bat"
echo "node_modules\\.bin\\electron.cmd" . >> "Lancer FosilaMaster.bat"
echo echo. >> "Lancer FosilaMaster.bat"
echo echo 🔄 Fermeture du serveur... >> "Lancer FosilaMaster.bat"
echo taskkill /f /im node.exe ^>nul 2^>^&1 >> "Lancer FosilaMaster.bat"
echo pause >> "Lancer FosilaMaster.bat"

echo ✅ Lanceur créé
echo.

echo ========================================
echo           🎉 DÉPLOIEMENT TERMINÉ !
echo ========================================
echo.
echo 📱 Pour lancer l'application :
echo    Double-cliquez sur "Lancer FosilaMaster.bat"
echo.
echo 🌐 Accès local : http://localhost:3000
echo.
echo 💡 L'application est maintenant prête à utiliser !
echo.
pause
`;

        await fs.writeFile(path.join(deployDir, 'Installation et Deploiement.bat'), installScript);
        
        // Créer le README de déploiement
        const readmeContent = `# FosilaMaster - Package de Déploiement

## 🚀 Installation sur un nouvel ordinateur

### 📋 Prérequis
- **Node.js** version 18.x ou 20.x (https://nodejs.org/)
- **Connexion Internet** pour télécharger les dépendances

### 🔧 Installation automatique
1. **Double-cliquez** sur \`Installation et Deploiement.bat\`
2. **Attendez** que l'installation se termine
3. **Lancez** l'application avec \`Lancer FosilaMaster.bat\`

### 📁 Fichiers inclus
- ✅ Code source de l'application
- ✅ Configuration Next.js et Tailwind
- ✅ Composants et services
- ✅ Scripts d'installation automatique
- ✅ Lanceur de l'application

### 🌐 Après installation
- **Accès local** : http://localhost:3000
- **Interface Electron** : Double-clic sur le lanceur
- **Serveur Next.js** : Démarrage automatique

### 💡 Avantages
- **Installation automatique** des dépendances
- **Construction automatique** de l'application
- **Lanceur prêt à l'emploi**
- **Pas de fichiers lourds** (.next, node_modules)

---
**FosilaMaster Desktop** - Gestion scolaire professionnelle
`;

        await fs.writeFile(path.join(deployDir, 'README-DEPLOIEMENT.md'), readmeContent);
        
        // Créer un script de nettoyage
        const cleanupScript = `@echo off
echo Nettoyage des fichiers temporaires...
if exist "node_modules" rmdir /s /q "node_modules"
if exist ".next" rmdir /s /q ".next"
if exist "package-lock.json" del "package-lock.json"
echo Nettoyage terminé !
pause
`;

        await fs.writeFile(path.join(deployDir, 'Nettoyage.bat'), cleanupScript);
        
        console.log('✅ Package de déploiement créé avec succès !');
        console.log(`📁 Dossier: ${deployDir}`);
        
        // Calculer la taille du package
        const size = await getDirectorySize(deployDir);
        console.log(`📊 Taille du package: ${(size / 1024 / 1024).toFixed(2)} MB`);
        
        console.log('\n🎯 Pour déployer sur un autre PC :');
        console.log('1. Copiez le dossier "fosilamaster-deployment"');
        console.log('2. Double-cliquez sur "Installation et Deploiement.bat"');
        console.log('3. Attendez la fin de l\'installation');
        console.log('4. Lancez avec "Lancer FosilaMaster.bat"');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création du package:', error);
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

createDeploymentPackage();











