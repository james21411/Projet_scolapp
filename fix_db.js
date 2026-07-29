const { createConnection } = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
  });

  const [dbs] = await conn.query('SHOW DATABASES LIKE "fosilamaster_%"');
  for (const db of dbs) {
    const dbName = Object.values(db)[0];
    if (dbName === 'fosilamaster_registry') continue;
    
    await conn.query(`USE \`${dbName}\``);
    
    // Check if school_levels exists and is empty
    try {
      const [levels] = await conn.query('SELECT COUNT(*) as c FROM school_levels');
      if (levels[0].c === 0) {
        console.log(`Populating ${dbName}...`);
        await conn.query(`
        INSERT IGNORE INTO school_levels (id, name, \`order\`, isActive) VALUES
        ('maternelle-id', 'Maternelle', 1, 1),
        ('primaire-id', 'Primaire', 2, 1),
        ('secondaire-id', 'Secondaire', 3, 1);
        `);

        await conn.query(`
        INSERT IGNORE INTO school_classes (id, levelId, name, \`order\`) VALUES
        (UUID(), 'maternelle-id', 'Petite Section', 1),
        (UUID(), 'maternelle-id', 'Moyenne Section', 2),
        (UUID(), 'maternelle-id', 'Grande Section', 3),

        (UUID(), 'primaire-id', 'SIL', 1),
        (UUID(), 'primaire-id', 'CP', 2),
        (UUID(), 'primaire-id', 'CE1', 3),
        (UUID(), 'primaire-id', 'CE2', 4),
        (UUID(), 'primaire-id', 'CM1', 5),
        (UUID(), 'primaire-id', 'CM2', 6),

        (UUID(), 'secondaire-id', '6ème', 1),
        (UUID(), 'secondaire-id', '5ème', 2),
        (UUID(), 'secondaire-id', '4ème', 3),
        (UUID(), 'secondaire-id', '3ème', 4),
        (UUID(), 'secondaire-id', '2nde', 5),
        (UUID(), 'secondaire-id', '1ère', 6),
        (UUID(), 'secondaire-id', 'Terminale', 7);
        `);
      }
    } catch (e) {
      // Ignorer si la table n'existe pas
    }
  }
  await conn.end();
}
run().catch(console.error);
