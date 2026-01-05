const mysql = require('mysql2/promise');
const readline = require('readline');

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nuttertools2.0',
    database: process.env.DB_NAME || 'scolapp',
    port: process.env.DB_PORT || 3306
};

// Mot de passe de sécurité pour l'exécution du nettoyage
const CLEANUP_PASSWORD = 'Nuttertools2.0';

 // Tables à nettoyer (données de test)
 const TABLES_TO_CLEAN = [
     // Personnel / enseignants
     'teacher_assignments',
     'personnel',
     'personnel_types',
     // Données élèves dépendantes
     'presences',
     'grades',
     'period_averages',
     'general_averages',
     'report_cards',
     'payments',
     // Autres données
     'class_subjects',
    'financial_transactions',
    'financial_services',
    'fee_structures',
     'payroll_records',
     'audit_logs',
     // Table des élèves en dernier (après suppression des dépendances)
     'students'
 ];

// Tables à préserver (données de base)
const TABLES_TO_PRESERVE = [
    'users',             // Comptes utilisateurs (sauf admin)
    'school_info',       // Informations de l'école
    'school_levels',     // Niveaux scolaires
    'school_classes',    // Classes (structure)
    'evaluation_periods', // Périodes d'évaluation
    'evaluation_types'   // Types d'évaluation
];

// Utilisateurs à préserver (garder seulement l'admin)
const PRESERVE_USERS = ['admin'];

async function createConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connexion à la base de données établie');
        return connection;
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error.message);
        throw error;
    }
}

async function verifyPassword() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('🔐 Entrez le mot de passe de sécurité pour continuer: ', (password) => {
            rl.close();
            if (password === CLEANUP_PASSWORD) {
                console.log('✅ Mot de passe correct');
                resolve(true);
            } else {
                console.log('❌ Mot de passe incorrect. Opération annulée.');
                resolve(false);
            }
        });
    });
}

async function showCurrentData(connection) {
    console.log('\n📊 Données actuelles dans la base:');
    console.log('=====================================');
    
    for (const table of TABLES_TO_CLEAN) {
        try {
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`📋 ${table}: ${rows[0].count} enregistrements`);
        } catch (error) {
            console.log(`📋 ${table}: Table non trouvée ou erreur`);
        }
    }
    
    console.log('\n📊 Tables préservées:');
    for (const table of TABLES_TO_PRESERVE) {
        try {
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`📋 ${table}: ${rows[0].count} enregistrements`);
        } catch (error) {
            console.log(`📋 ${table}: Table non trouvée ou erreur`);
        }
    }
}

async function cleanTable(connection, tableName) {
    try {
        const [result] = await connection.execute(`DELETE FROM ${tableName}`);
        console.log(`✅ Table ${tableName} nettoyée: ${result.affectedRows} enregistrements supprimés`);
        return result.affectedRows;
    } catch (error) {
        console.log(`⚠️  Erreur lors du nettoyage de ${tableName}: ${error.message}`);
        return 0;
    }
}

async function cleanUsersTable(connection) {
    try {
        // Garder seulement l'utilisateur admin
        const placeholders = PRESERVE_USERS.map(() => '?').join(',');
        const [result] = await connection.execute(
            `DELETE FROM users WHERE id NOT IN (${placeholders})`,
            PRESERVE_USERS
        );
        console.log(`✅ Table users nettoyée: ${result.affectedRows} utilisateurs supprimés (admin préservé)`);
        return result.affectedRows;
    } catch (error) {
        console.log(`⚠️  Erreur lors du nettoyage de la table users: ${error.message}`);
        return 0;
    }
}

async function resetAutoIncrement(connection, tableName) {
    try {
        await connection.execute(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
        console.log(`✅ Auto-increment de ${tableName} réinitialisé`);
    } catch (error) {
        // Ignorer les erreurs pour les tables sans auto-increment
    }
}

async function cleanupDatabase() {
    console.log('🧹 SCRIPT DE NETTOYAGE DE BASE DE DONNÉES SCOLAPP');
    console.log('================================================');
    console.log('⚠️  ATTENTION: Cette opération va supprimer TOUTES les données de test');
    console.log('📋 Données supprimées: élèves, notes, paiements, présences, bulletins, etc.');
    console.log('📋 Données préservées: comptes utilisateurs, structure école, périodes d\'évaluation');
    console.log('');

    // Vérification du mot de passe
    const passwordValid = await verifyPassword();
    if (!passwordValid) {
        process.exit(1);
    }

    let connection;
    try {
        // Connexion à la base de données
        connection = await createConnection();

        // Afficher les données actuelles
        await showCurrentData(connection);

        // Confirmation finale
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const confirm = await new Promise((resolve) => {
            rl.question('\n⚠️  Êtes-vous sûr de vouloir continuer? (oui/non): ', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o');
            });
        });

        if (!confirm) {
            console.log('❌ Opération annulée par l\'utilisateur');
            return;
        }

        console.log('\n🧹 Début du nettoyage...');
        console.log('========================');

        let totalDeleted = 0;

        // Nettoyer les tables de données de test
        for (const table of TABLES_TO_CLEAN) {
            const deleted = await cleanTable(connection, table);
            totalDeleted += deleted;
        }

        // Nettoyer la table users (garder seulement admin)
        const deletedUsers = await cleanUsersTable(connection);
        totalDeleted += deletedUsers;

        // Réinitialiser les auto-increment
        console.log('\n🔄 Réinitialisation des auto-increment...');
        for (const table of TABLES_TO_CLEAN) {
            await resetAutoIncrement(connection, table);
        }
        await resetAutoIncrement(connection, 'users');

        console.log('\n✅ NETTOYAGE TERMINÉ');
        console.log('===================');
        console.log(`📊 Total d'enregistrements supprimés: ${totalDeleted}`);
        console.log('📋 Données préservées:');
        console.log('   - Compte administrateur');
        console.log('   - Informations de l\'école');
        console.log('   - Structure des niveaux et classes');
        console.log('   - Périodes d\'évaluation');
        console.log('   - Types d\'évaluation');
        console.log('\n🎉 La base de données est maintenant prête pour l\'installation chez le client!');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion à la base de données fermée');
        }
    }
}

// Exécuter le script
if (require.main === module) {
    cleanupDatabase().catch(console.error);
}

module.exports = { cleanupDatabase, CLEANUP_PASSWORD };
