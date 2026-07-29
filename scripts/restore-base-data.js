const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'scolapp',
    port: process.env.DB_PORT || 3306
};

async function restoreBaseData() {
    console.log('🔄 RESTAURATION DES DONNÉES DE BASE');
    console.log('==================================');

    let connection;
    try {
        // Connexion à la base de données
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connexion à la base de données établie');

        // Vérifier que l'utilisateur admin existe
        const [adminUsers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE id = "admin"');
        if (adminUsers[0].count === 0) {
            console.log('🔧 Création du compte administrateur...');
            await connection.execute(`
                INSERT INTO users (id, username, fullName, passwordHash, role, email, phone, createdAt)
                VALUES ('admin', 'admin', 'Administrateur', 'admin123', 'Admin', 'admin@school.com', '', NOW())
            `);
            console.log('✅ Compte administrateur créé');
        } else {
            console.log('✅ Compte administrateur existe déjà');
        }

        // Vérifier les informations de l'école
        const [schoolInfo] = await connection.execute('SELECT COUNT(*) as count FROM school_info');
        if (schoolInfo[0].count === 0) {
            console.log('🔧 Création des informations de base de l\'école...');
            await connection.execute(`
                INSERT INTO school_info (id, name, address, phone, email, director, createdAt)
                VALUES ('school-1', 'École Primaire', '123 Rue de l\'École', '0123456789', 'contact@ecole.com', 'Directeur', NOW())
            `);
            console.log('✅ Informations de l\'école créées');
        } else {
            console.log('✅ Informations de l\'école existent déjà');
        }

        // Vérifier les niveaux scolaires
        const [levels] = await connection.execute('SELECT COUNT(*) as count FROM school_levels');
        if (levels[0].count === 0) {
            console.log('🔧 Création des niveaux scolaires...');
            await connection.execute(`
                INSERT INTO school_levels (id, name, description, isActive, createdAt)
                VALUES 
                ('level-1', 'CP', 'Cours Préparatoire', true, NOW()),
                ('level-2', 'CE1', 'Cours Élémentaire 1', true, NOW()),
                ('level-3', 'CE2', 'Cours Élémentaire 2', true, NOW()),
                ('level-4', 'CM1', 'Cours Moyen 1', true, NOW()),
                ('level-5', 'CM2', 'Cours Moyen 2', true, NOW())
            `);
            console.log('✅ Niveaux scolaires créés');
        } else {
            console.log('✅ Niveaux scolaires existent déjà');
        }

        // Vérifier les classes
        const [classes] = await connection.execute('SELECT COUNT(*) as count FROM school_classes');
        if (classes[0].count === 0) {
            console.log('🔧 Création des classes...');
            await connection.execute(`
                INSERT INTO school_classes (id, name, levelId, schoolYear, isActive, createdAt)
                VALUES 
                ('class-1', 'CP A', 'level-1', '2025-2026', true, NOW()),
                ('class-2', 'CE1 A', 'level-2', '2025-2026', true, NOW()),
                ('class-3', 'CE2 A', 'level-3', '2025-2026', true, NOW()),
                ('class-4', 'CM1 A', 'level-4', '2025-2026', true, NOW()),
                ('class-5', 'CM2 A', 'level-5', '2025-2026', true, NOW())
            `);
            console.log('✅ Classes créées');
        } else {
            console.log('✅ Classes existent déjà');
        }

        // Vérifier les périodes d'évaluation
        const [periods] = await connection.execute('SELECT COUNT(*) as count FROM evaluation_periods');
        if (periods[0].count === 0) {
            console.log('🔧 Création des périodes d\'évaluation...');
            await connection.execute(`
                INSERT INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, \`order\`, isActive, createdAt)
                VALUES 
                ('seq1-2025-2026', '1ère Séquence', 'sequence', '2025-09-01', '2025-10-31', '2025-2026', 1, true, NOW()),
                ('seq2-2025-2026', '2ème Séquence', 'sequence', '2025-11-01', '2025-12-31', '2025-2026', 2, true, NOW()),
                ('seq3-2025-2026', '3ème Séquence', 'sequence', '2026-01-01', '2026-02-28', '2025-2026', 3, true, NOW()),
                ('seq4-2025-2026', '4ème Séquence', 'sequence', '2026-03-01', '2026-04-30', '2025-2026', 4, true, NOW()),
                ('trim1-2025-2026', '1er Trimestre', 'trimestre', '2025-09-01', '2025-12-31', '2025-2026', 5, true, NOW()),
                ('trim2-2025-2026', '2ème Trimestre', 'trimestre', '2026-01-01', '2026-04-30', '2025-2026', 6, true, NOW()),
                ('trim3-2025-2026', '3ème Trimestre', 'trimestre', '2026-05-01', '2026-07-31', '2025-2026', 7, true, NOW())
            `);
            console.log('✅ Périodes d\'évaluation créées');
        } else {
            console.log('✅ Périodes d\'évaluation existent déjà');
        }

        // Vérifier les types d'évaluation
        const [evalTypes] = await connection.execute('SELECT COUNT(*) as count FROM evaluation_types');
        if (evalTypes[0].count === 0) {
            console.log('🔧 Création des types d\'évaluation...');
            await connection.execute(`
                INSERT INTO evaluation_types (id, name, description, createdAt)
                VALUES 
                ('eval-controle', 'Contrôle', 'Évaluation écrite', NOW()),
                ('eval-devoir', 'Devoir', 'Devoir à la maison', NOW()),
                ('eval-oral', 'Oral', 'Évaluation orale', NOW()),
                ('eval-tp', 'TP', 'Travaux pratiques', NOW())
            `);
            console.log('✅ Types d\'évaluation créés');
        } else {
            console.log('✅ Types d\'évaluation existent déjà');
        }

        console.log('\n✅ RESTAURATION TERMINÉE');
        console.log('========================');
        console.log('📋 Données de base restaurées:');
        console.log('   - Compte administrateur');
        console.log('   - Informations de l\'école');
        console.log('   - Niveaux scolaires (CP, CE1, CE2, CM1, CM2)');
        console.log('   - Classes par niveau');
        console.log('   - Périodes d\'évaluation');
        console.log('   - Types d\'évaluation');
        console.log('\n🎉 L\'application est maintenant prête à être utilisée!');

    } catch (error) {
        console.error('❌ Erreur lors de la restauration:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée');
        }
    }
}

// Exécuter la restauration
if (require.main === module) {
    restoreBaseData().catch(console.error);
}

module.exports = { restoreBaseData };

