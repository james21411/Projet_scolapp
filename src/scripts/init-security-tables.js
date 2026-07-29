const mysql = require('mysql2/promise');

async function initSecurityTables() {
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

    console.log('🔍 Initialisation des tables de sécurité...');

    // Créer la table password_policies
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS password_policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        minLength INT NOT NULL DEFAULT 8,
        requireUppercase BOOLEAN NOT NULL DEFAULT true,
        requireLowercase BOOLEAN NOT NULL DEFAULT true,
        requireNumbers BOOLEAN NOT NULL DEFAULT true,
        requireSpecialChars BOOLEAN NOT NULL DEFAULT true,
        maxAge INT NOT NULL DEFAULT 90,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table password_policies créée avec succès !');

    // Créer la table security_settings
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sessionTimeout INT NOT NULL DEFAULT 30,
        maxLoginAttempts INT NOT NULL DEFAULT 5,
        lockoutDuration INT NOT NULL DEFAULT 15,
        requireTwoFactor BOOLEAN NOT NULL DEFAULT false,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table security_settings créée avec succès !');

    // Créer la table roles
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        isActive BOOLEAN NOT NULL DEFAULT true,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table roles créée avec succès !');

    // Insérer des données par défaut pour password_policies
    await connection.execute(`
      INSERT IGNORE INTO password_policies (minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, maxAge)
      VALUES (8, true, true, true, true, 90)
    `);

    console.log('✅ Données par défaut insérées dans password_policies !');

    // Insérer des données par défaut pour security_settings
    await connection.execute(`
      INSERT IGNORE INTO security_settings (sessionTimeout, maxLoginAttempts, lockoutDuration, requireTwoFactor)
      VALUES (30, 5, 15, false)
    `);

    console.log('✅ Données par défaut insérées dans security_settings !');

    // Insérer quelques rôles par défaut
    await connection.execute(`
      INSERT IGNORE INTO roles (id, name, description, permissions, isActive) VALUES
      ('role-admin', 'Administrateur', 'Accès complet au système', '["users.read","users.create","users.update","users.delete","roles.read","roles.create","roles.update","roles.delete","students.read","students.create","students.update","students.delete","finances.read","finances.create","finances.update","finances.delete","reports.read","reports.create","settings.read","settings.update","security.read","security.update","backup.create","backup.restore"]', true),
      ('role-direction', 'Direction', 'Gestion de l\'établissement', '["students.read","students.create","students.update","students.delete","finances.read","finances.create","finances.update","finances.delete","reports.read","reports.create","settings.read","settings.update"]', true),
      ('role-comptable', 'Comptable', 'Gestion financière', '["finances.read","finances.create","finances.update","finances.delete","reports.read","reports.create"]', true),
      ('role-enseignant', 'Enseignant', 'Gestion des élèves', '["students.read","students.create","students.update"]', true)
    `);

    console.log('✅ Rôles par défaut insérés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = { initSecurityTables }; 