const mysql = require('mysql2/promise');

async function optimizeMySQLConfig() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
    database: process.env.MYSQL_DATABASE || 'scolapp',
  });

  try {
    console.log('🔧 Optimisation de la configuration MySQL...');

    // Augmenter le nombre maximum de connexions
    await connection.execute('SET GLOBAL max_connections = 200');
    console.log('✅ max_connections augmenté à 200');

    // Augmenter le timeout des connexions
    await connection.execute('SET GLOBAL connect_timeout = 60');
    console.log('✅ connect_timeout défini à 60 secondes');

    // Augmenter le timeout d'attente
    await connection.execute('SET GLOBAL wait_timeout = 28800');
    console.log('✅ wait_timeout défini à 28800 secondes (8 heures)');

    // Augmenter le timeout d'interaction
    await connection.execute('SET GLOBAL interactive_timeout = 28800');
    console.log('✅ interactive_timeout défini à 28800 secondes');

    // Optimiser les paramètres de performance
    await connection.execute('SET GLOBAL innodb_buffer_pool_size = 268435456'); // 256MB
    console.log('✅ innodb_buffer_pool_size défini à 256MB');

    // Vérifier les paramètres actuels
    const [rows] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');
    console.log('📊 Configuration actuelle:', rows[0]);

    console.log('✅ Configuration MySQL optimisée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error.message);
  } finally {
    await connection.end();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  optimizeMySQLConfig();
}

module.exports = { optimizeMySQLConfig }; 