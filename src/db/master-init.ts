import mysql from 'mysql2/promise';

export async function initMasterDatabase() {
    const masterDbName = process.env.MYSQL_DATABASE || 'scolapp';
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
        database: masterDbName,
    });

    console.log(`📡 Initialisation de la base master: ${masterDbName}`);

    // Table pour enregistrer toutes les écoles du système
    const createSchoolsTable = `
    CREATE TABLE IF NOT EXISTS registered_schools (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      db_name VARCHAR(100) NOT NULL UNIQUE,
      domain_prefix VARCHAR(100),
      admin_email VARCHAR(255),
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      plan ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_activity TIMESTAMP NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

    await connection.execute(createSchoolsTable);

    // Ajouter l'école par défaut si nécessaire
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM registered_schools WHERE db_name = ?', [masterDbName]);
    if ((rows as any)[0].count === 0) {
        await connection.execute(
            'INSERT INTO registered_schools (name, db_name, status) VALUES (?, ?, ?)',
            ['FosilaMaster Master', masterDbName, 'active']
        );
        console.log(`✅ École par défaut (${masterDbName}) enregistrée.`);
    }

    await connection.end();
}
