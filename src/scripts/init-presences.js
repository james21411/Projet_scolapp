const mysql = require('mysql2/promise');

async function initPresences() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    });

    console.log('🔍 Initialisation de la table presences...');

    // Supprimer l'ancienne table si elle existe avec la mauvaise structure
    await connection.execute('DROP TABLE IF EXISTS presences');

    // Créer la table avec la bonne structure
    await connection.execute(`
      CREATE TABLE presences (
        id VARCHAR(255) PRIMARY KEY,
        type ENUM('eleve', 'personnel') NOT NULL,
        personId VARCHAR(255) NOT NULL,
        personName VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'retard', 'exclusion') NOT NULL DEFAULT 'present',
        details TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_date (date),
        INDEX idx_type (type),
        INDEX idx_person (personId),
        INDEX idx_status (status)
      )
    `);

    console.log('✅ Table presences créée avec succès !');

    // Insérer quelques données d'exemple
    await connection.execute(`
      INSERT INTO presences (id, type, personId, personName, date, status, details, createdAt, updatedAt) VALUES
      ('presence-1', 'eleve', 'student-1', 'Jean Dupont', '2025-01-28', 'present', 'Arrivé à l\'heure', NOW(), NOW()),
      ('presence-2', 'eleve', 'student-2', 'Marie Martin', '2025-01-28', 'retard', 'Arrivé 15 minutes en retard', NOW(), NOW()),
      ('presence-3', 'personnel', 'user-1', 'Prof. Smith', '2025-01-28', 'present', 'Présent toute la journée', NOW(), NOW()),
      ('presence-4', 'eleve', 'student-3', 'Pierre Durand', '2025-01-28', 'absent', 'Absence justifiée - maladie', NOW(), NOW()),
      ('presence-5', 'personnel', 'user-2', 'Mme. Johnson', '2025-01-28', 'present', 'Présente', NOW(), NOW())
    `);

    console.log('✅ Données d\'exemple insérées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter l'initialisation si le script est appelé directement
if (require.main === module) {
  initPresences();
}

module.exports = { initPresences }; 