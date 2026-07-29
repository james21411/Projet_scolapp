const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nuttertools2.0',
    database: process.env.DB_NAME || 'scolapp',
    port: process.env.DB_PORT || 3306
};

async function testCleanup() {
    console.log('🧪 TEST DU SCRIPT DE NETTOYAGE');
    console.log('==============================');

    let connection;
    try {
        // Connexion à la base de données
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connexion à la base de données établie');

        // Vérifier les tables existantes
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📋 Tables existantes:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });

        // Compter les enregistrements avant nettoyage
        console.log('\n📊 Données avant nettoyage:');
        const tablesToCheck = ['students', 'grades', 'payments', 'presences', 'users', 'school_info'];
        
        for (const table of tablesToCheck) {
            try {
                const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`   ${table}: ${rows[0].count} enregistrements`);
            } catch (error) {
                console.log(`   ${table}: Table non trouvée`);
            }
        }

        // Simuler l'insertion de données de test
        console.log('\n🔧 Insertion de données de test...');
        
        // Insérer un élève de test
        await connection.execute(`
            INSERT IGNORE INTO students (id, firstName, lastName, dateOfBirth, classId, schoolYear, status)
            VALUES ('test-student-1', 'Test', 'Student', '2010-01-01', 'class-1', '2025-2026', 'active')
        `);

        // Insérer des notes de test
        await connection.execute(`
            INSERT IGNORE INTO grades (id, studentId, subjectId, evaluationTypeId, score, coefficient, evaluationPeriodId, schoolYear)
            VALUES ('test-grade-1', 'test-student-1', 'math', 'eval-controle', 15.5, 2.0, 'seq1-2025-2026', '2025-2026')
        `);

        // Insérer un paiement de test
        await connection.execute(`
            INSERT IGNORE INTO payments (id, studentId, amount, paymentType, description, schoolYear)
            VALUES ('test-payment-1', 'test-student-1', 50000, 'registration', 'Frais d\'inscription', '2025-2026')
        `);

        console.log('✅ Données de test insérées');

        // Compter les enregistrements après insertion
        console.log('\n📊 Données après insertion de test:');
        for (const table of tablesToCheck) {
            try {
                const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`   ${table}: ${rows[0].count} enregistrements`);
            } catch (error) {
                console.log(`   ${table}: Table non trouvée`);
            }
        }

        console.log('\n✅ Test terminé - Les données de test sont prêtes pour le nettoyage');
        console.log('💡 Vous pouvez maintenant exécuter le script de nettoyage');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée');
        }
    }
}

// Exécuter le test
if (require.main === module) {
    testCleanup().catch(console.error);
}

module.exports = { testCleanup };
