const { createConnection } = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
  });

  const [dbs] = await conn.query('SHOW DATABASES LIKE "scolapp_%"');
  for (const db of dbs) {
    const dbName = Object.values(db)[0];
    if (dbName === 'scolapp_registry') continue;
    
    await conn.query(`USE \`${dbName}\``);
    
    try {
      const [types] = await conn.query('SELECT COUNT(*) as c FROM personnel_types');
      if (types[0].c === 0) {
        console.log(`Populating personnel_types for ${dbName}...`);
        await conn.query(`
        INSERT IGNORE INTO personnel_types (id, name, description, isTeachingRole, \`order\`) VALUES
        ('pt-ens', 'Enseignant', 'Personnel enseignant de l établissement', 1, 1),
        ('pt-dir', 'Direction', 'Personnel dirigeant (Proviseur, Censeur, etc.)', 0, 2),
        ('pt-adm', 'Administration', 'Personnel administratif (Secrétariat, Scolarité, etc.)', 0, 3),
        ('pt-surv', 'Surveillance', 'Surveillants généraux et surveillants de secteur', 0, 4),
        ('pt-comp', 'Comptabilité', 'Service financier et comptabilité', 0, 5),
        ('pt-maint', 'Maintenance', 'Personnel d entretien et gardiennage', 0, 6)
        `);
      }
    } catch (e) {
      // Ignore if table doesn't exist
    }
  }
  await conn.end();
}
run().catch(console.error);
