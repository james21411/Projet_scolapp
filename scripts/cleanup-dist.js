const fs = require('fs-extra');
const path = require('path');

async function cleanupDist() {
    console.log('🧹 Nettoyage du dossier dist...');
    
    const distDir = 'dist';
    
    try {
        if (!await fs.pathExists(distDir)) {
            console.log('❌ Le dossier dist n\'existe pas');
            return;
        }
        
        // Dossiers et fichiers lourds à supprimer
        const heavyItems = [
            'scolapp-professional/.next',
            'scolapp-professional/node_modules',
            'scolapp-professional/public/.next',
            'scolapp-professional/public/node_modules',
            'scolapp-professional/.next',
            'scolapp-professional/node_modules',
            'scolapp-executable/.next',
            'scolapp-executable/node_modules',
            'scolapp-launcher/.next',
            'scolapp-launcher/node_modules'
        ];
        
        let totalFreed = 0;
        
        for (const item of heavyItems) {
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
        
        // Supprimer aussi les dossiers .next et node_modules dans dist directement
        const directHeavyItems = [
            '.next',
            'node_modules'
        ];
        
        for (const item of directHeavyItems) {
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
        
        console.log('\n🎉 Nettoyage terminé !');
        console.log(`📊 Espace libéré: ${freedMB} MB`);
        console.log(`📁 Nouvelle taille du dossier dist: ${newSizeMB} MB`);
        
        // Créer un fichier de nettoyage automatique
        const cleanupScript = `@echo off
title Nettoyage Automatique Dist
color 0C

echo ========================================
echo        NETTOYAGE AUTOMATIQUE DIST
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

        await fs.writeFile(path.join(distDir, '🧹 Nettoyage Automatique.bat'), cleanupScript);
        
        console.log('\n💡 Fichier de nettoyage créé: "🧹 Nettoyage Automatique.bat"');
        console.log('   Vous pouvez l\'utiliser pour nettoyer automatiquement à l\'avenir');
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
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

cleanupDist();











