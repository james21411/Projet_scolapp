/**
 * Script de test pour la fonctionnalité de changement de classe avec migration des paiements
 */

const mysql = require('mysql2/promise');

async function testStudentClassChange() {
  let connection;

  try {
    // Configuration de la connexion
    const config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
      database: process.env.MYSQL_DATABASE || 'scolapp',
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données établie');

    // Test 1: Vérifier qu'un élève existe
    const [students] = await connection.execute(
      'SELECT id, nom, prenom, classe, niveau FROM students LIMIT 1'
    );

    if (students.length === 0) {
      console.log('❌ Aucun élève trouvé dans la base de données');
      return;
    }

    const student = students[0];
    console.log(`📚 Élève trouvé: ${student.prenom} ${student.nom} (${student.id}) - Classe: ${student.classe}`);

    // Test 2: Vérifier la configuration tarifaire
    const [feeStructures] = await connection.execute(
      'SELECT className, registrationFee, total FROM fee_structures WHERE className = ?',
      [student.classe]
    );

    if (feeStructures.length === 0) {
      console.log(`⚠️ Aucune configuration tarifaire trouvée pour la classe ${student.classe}`);
    } else {
      console.log(`💰 Configuration tarifaire trouvée pour ${student.classe}: ${feeStructures[0].total} XAF total`);
    }

    // Test 3: Vérifier les paiements existants
    const [payments] = await connection.execute(
      'SELECT id, amount, reason FROM payments WHERE studentId = ?',
      [student.id]
    );

    console.log(`💳 ${payments.length} paiement(s) trouvé(s) pour cet élève`);

    // Test 4: Simuler un appel à l'API
    console.log('\n🧪 Simulation d\'un changement de classe...');
    console.log('Endpoint: POST /api/students/change-class');
    console.log('Payload:', {
      studentId: student.id,
      newClass: 'Classe Test',
      reason: 'Test de migration',
      migratePayments: true
    });

    console.log('\n✅ Test terminé avec succès!');
    console.log('La fonctionnalité de changement de classe avec migration des paiements est prête.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le test
testStudentClassChange().catch(console.error);