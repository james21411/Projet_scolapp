const { cleanupDatabase } = require('./cleanup-database');
const { restoreBaseData } = require('./restore-base-data');
const readline = require('readline');

const CLEANUP_PASSWORD = 'Nuttertools2.0';

async function prepareForClient() {
    console.log('🚀 PRÉPARATION POUR INSTALLATION CLIENT');
    console.log('=======================================');
    console.log('Ce script va:');
    console.log('1. Nettoyer toutes les données de test');
    console.log('2. Restaurer les données de base nécessaires');
    console.log('3. Préparer l\'application pour l\'installation chez le client');
    console.log('');

    // Vérification du mot de passe
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const password = await new Promise((resolve) => {
        rl.question('🔐 Entrez le mot de passe de sécurité pour continuer: ', (answer) => {
            rl.close();
            resolve(answer);
        });
    });

    if (password !== CLEANUP_PASSWORD) {
        console.log('❌ Mot de passe incorrect. Opération annulée.');
        process.exit(1);
    }

    try {
        // Étape 1: Nettoyage de la base de données
        console.log('\n🧹 ÉTAPE 1: NETTOYAGE DE LA BASE DE DONNÉES');
        console.log('==========================================');
        await cleanupDatabase();

        // Étape 2: Restauration des données de base
        console.log('\n🔄 ÉTAPE 2: RESTAURATION DES DONNÉES DE BASE');
        console.log('===========================================');
        await restoreBaseData();

        console.log('\n🎉 PRÉPARATION TERMINÉE AVEC SUCCÈS!');
        console.log('===================================');
        console.log('✅ La base de données est maintenant prête pour l\'installation chez le client');
        console.log('✅ Toutes les données de test ont été supprimées');
        console.log('✅ Les données de base nécessaires ont été restaurées');
        console.log('✅ L\'application peut être déployée en production');
        console.log('');
        console.log('📋 Informations de connexion par défaut:');
        console.log('   - Utilisateur: admin');
        console.log('   - Mot de passe: admin123');
        console.log('   - Rôle: Administrateur');
        console.log('');
        console.log('⚠️  IMPORTANT: Changez le mot de passe administrateur après l\'installation!');

    } catch (error) {
        console.error('❌ Erreur lors de la préparation:', error.message);
        process.exit(1);
    }
}

// Exécuter le script
if (require.main === module) {
    prepareForClient().catch(console.error);
}

module.exports = { prepareForClient };

