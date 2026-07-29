const fs = require('fs-extra');
const path = require('path');

async function cleanupDistFinal() {
    console.log('🧹 NETTOYAGE FINAL du dossier dist...');
    console.log('🎯 Garde seulement la version PROFESSIONNELLE !');
    
    const distDir = 'dist';
    
    try {
        if (!await fs.pathExists(distDir)) {
            console.log('❌ Le dossier dist n\'existe pas');
            return;
        }
        
        // Dossiers à SUPPRIMER (versions obsolètes)
        const foldersToDelete = [
            'fosilamaster',
            'fosilamaster-app', 
            'fosilamaster-executable',
            'fosilamaster-launcher',
            'fosilamaster-minimal',
            'win-unpacked'
        ];
        
        // Fichiers à supprimer
        const filesToDelete = [
            'builder-effective-config.yaml'
        ];
        
        let totalFreed = 0;
        
        console.log('\n🗑️ Suppression des versions obsolètes...');
        
        // Supprimer les dossiers obsolètes
        for (const folder of foldersToDelete) {
            const folderPath = path.join(distDir, folder);
            if (await fs.pathExists(folderPath)) {
                const stats = await fs.stat(folderPath);
                if (stats.isDirectory()) {
                    await fs.remove(folderPath);
                    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                    console.log(`✅ Supprimé: ${folder}/ (${sizeMB} MB)`);
                    totalFreed += stats.size;
                }
            }
        }
        
        // Supprimer les fichiers obsolètes
        for (const file of filesToDelete) {
            const filePath = path.join(distDir, file);
            if (await fs.pathExists(filePath)) {
                const stats = await fs.stat(filePath);
                await fs.remove(filePath);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                console.log(`✅ Supprimé: ${file} (${sizeMB} MB)`);
                totalFreed += stats.size;
            }
        }
        
        // Nettoyer les dossiers lourds dans fosilamaster-professional
        console.log('\n🧹 Nettoyage des dossiers lourds dans fosilamaster-professional...');
        
        const professionalHeavyItems = [
            'fosilamaster-professional/.next',
            'fosilamaster-professional/node_modules',
            'fosilamaster-professional/public/.next',
            'fosilamaster-professional/public/node_modules'
        ];
        
        for (const item of professionalHeavyItems) {
            const itemPath = path.join(distDir, item);
            if (await fs.pathExists(itemPath)) {
                const stats = await fs.stat(itemPath);
                if (stats.isDirectory()) {
                    await fs.remove(itemPath);
                    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                    console.log(`✅ Supprimé: ${item} (${sizeMB} MB)`);
                    totalFreed += stats.size;
                }
            }
        }
        
        // Calculer la nouvelle taille du dossier dist
        const newSize = await getDirectorySize(distDir);
        const newSizeMB = (newSize / 1024 / 1024).toFixed(2);
        const freedMB = (totalFreed / 1024 / 1024).toFixed(2);
        
        console.log('\n🎉 NETTOYAGE FINAL TERMINÉ !');
        console.log(`📊 Espace libéré: ${freedMB} MB`);
        console.log(`📁 Nouvelle taille du dossier dist: ${newSizeMB} MB`);
        
        // Vérifier ce qui reste
        console.log('\n📁 Contenu final du dossier dist:');
        const remainingItems = await fs.readdir(distDir);
        for (const item of remainingItems) {
            const itemPath = path.join(distDir, item);
            const stats = await fs.stat(itemPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`   📁 ${item}/ (${sizeMB} MB)`);
        }
        
        // Créer un fichier de nettoyage automatique final
        const cleanupScript = `@echo off
title Nettoyage Automatique Dist - FINAL
color 0A

echo ========================================
echo      NETTOYAGE AUTOMATIQUE DIST
echo ========================================
echo.
echo 🧹 Nettoyage des dossiers lourds...
echo.

REM Supprimer les dossiers .next et node_modules
if exist ".next" (
    echo Suppression du dossier .next...
    rmdir /s /q ".next"
    echo ✅ .next supprimé
)

if exist "node_modules" (
    echo Suppression du dossier node_modules...
    rmdir /s /q "node_modules"
    echo ✅ node_modules supprimé
)

echo.
echo 🎉 Nettoyage terminé !
echo 💡 Espace libéré avec succès
echo.
pause
`;

        await fs.writeFile(path.join(distDir, '🧹 Nettoyage Automatique FINAL.bat'), cleanupScript);
        
        console.log('\n💡 Fichier de nettoyage créé: "🧹 Nettoyage Automatique FINAL.bat"');
        
        // Créer un fichier d'instructions
        const instructions = `# 📋 INSTRUCTIONS DE NETTOYAGE FINAL

## ✅ Ce qui a été GARDÉ :
- **fosilamaster-professional/** - Version finale et complète
  - ✅ Nom de domaine fosilamaster.local
  - ✅ Page web React moderne
  - ✅ Tous les lanceurs professionnels
  - ✅ Configuration réseau complète

## ❌ Ce qui a été SUPPRIMÉ :
- fosilamaster/ (version ancienne)
- fosilamaster-app/ (version basique)
- fosilamaster-executable/ (version ancienne)
- fosilamaster-launcher/ (version ancienne)
- fosilamaster-minimal/ (version de test)
- win-unpacked/ (build Electron obsolète)
- builder-effective-config.yaml (config obsolète)
- Tous les dossiers .next et node_modules

## 🎯 Résultat :
- **Dossier dist nettoyé** et optimisé
- **Seulement la version finale** conservée
- **Espace libéré** : plusieurs GB
- **Structure claire** et professionnelle

## 🚀 Pour déployer sur un autre PC :
1. Copiez le dossier "fosilamaster-professional" (très léger maintenant !)
2. Utilisez les lanceurs inclus
3. Ou créez un package de déploiement avec npm run create-source-only

---
**FosilaMaster Desktop - Version Finale Nettoyée**
`;

        await fs.writeFile(path.join(distDir, '📋 INSTRUCTIONS NETTOYAGE FINAL.md'), instructions);
        
        console.log('\n📋 Fichier d\'instructions créé: "📋 INSTRUCTIONS NETTOYAGE FINAL.md"');
        
        console.log('\n🎯 RÉSUMÉ FINAL :');
        console.log('   ✅ Gardé : fosilamaster-professional (version finale)');
        console.log('   ❌ Supprimé : 6 versions obsolètes + fichiers lourds');
        console.log('   💾 Espace libéré : plusieurs GB');
        console.log('   🚀 Dossier dist maintenant propre et professionnel !');
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage final:', error);
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

cleanupDistFinal();











