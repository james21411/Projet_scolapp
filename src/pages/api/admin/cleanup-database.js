import mysql from 'mysql2/promise';

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
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
    // Table des élèves en dernier
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
        return connection;
    } catch (error) {
        throw new Error(`Erreur de connexion à la base de données: ${error.message}`);
    }
}

async function cleanTable(connection, tableName) {
    try {
        const [result] = await connection.execute(`DELETE FROM ${tableName}`);
        return result.affectedRows;
    } catch (error) {
        console.log(`Erreur lors du nettoyage de ${tableName}: ${error.message}`);
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
        return result.affectedRows;
    } catch (error) {
        console.log(`Erreur lors du nettoyage de la table users: ${error.message}`);
        return 0;
    }
}

async function resetAutoIncrement(connection, tableName) {
    try {
        await connection.execute(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
    } catch (error) {
        // Ignorer les erreurs pour les tables sans auto-increment
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { password, confirm } = req.body;

    // Vérification du mot de passe
    if (password !== CLEANUP_PASSWORD) {
        return res.status(401).json({ 
            error: 'Mot de passe incorrect',
            success: false 
        });
    }

    // Vérification de la confirmation
    if (!confirm) {
        return res.status(400).json({ 
            error: 'Confirmation requise',
            success: false 
        });
    }

    let connection;
    try {
        // Connexion à la base de données
        connection = await createConnection();

        let totalDeleted = 0;
        const results = {};

        // Nettoyer les tables de données de test
        for (const table of TABLES_TO_CLEAN) {
            const deleted = await cleanTable(connection, table);
            totalDeleted += deleted;
            results[table] = deleted;
        }

        // Nettoyer la table users (garder seulement admin)
        const deletedUsers = await cleanUsersTable(connection);
        totalDeleted += deletedUsers;
        results.users = deletedUsers;

        // Réinitialiser les auto-increment
        for (const table of TABLES_TO_CLEAN) {
            await resetAutoIncrement(connection, table);
        }
        await resetAutoIncrement(connection, 'users');

        return res.status(200).json({
            success: true,
            message: 'Nettoyage de la base de données terminé avec succès',
            totalDeleted,
            details: results,
            preserved: {
                users: 'Compte administrateur préservé',
                school_info: 'Informations de l\'école préservées',
                school_levels: 'Niveaux scolaires préservés',
                school_classes: 'Structure des classes préservée',
                evaluation_periods: 'Périodes d\'évaluation préservées',
                evaluation_types: 'Types d\'évaluation préservés'
            }
        });

    } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
        return res.status(500).json({ 
            error: 'Erreur lors du nettoyage de la base de données',
            details: error.message,
            success: false 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

