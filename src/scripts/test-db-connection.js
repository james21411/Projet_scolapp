const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('Test de connexion à la base de données MySQL...');
  
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
    database: process.env.MYSQL_DATABASE || 'scolapp',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 10,
    multipleStatements: true,
    dateStrings: true,
    charset: 'utf8mb4',
  };

  console.log('Configuration MySQL:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });

  try {
    // Créer un pool de connexion
    const pool = mysql.createPool(config);
    
    // Tester la connexion
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL établie avec succès!');
    
    // Tester une requête simple
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('✅ Requête de test réussie:', rows);
    
    // Vérifier si la table users existe
    const [tables] = await connection.query('SHOW TABLES LIKE "users"');
    if (tables.length > 0) {
      console.log('✅ Table "users" trouvée');
      
      // Compter les utilisateurs
      const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
      console.log(`📊 Nombre d'utilisateurs dans la base: ${userCount[0].count}`);
    } else {
      console.log('⚠️  Table "users" non trouvée');
    }
    
    connection.release();
    await pool.end();
    
    console.log('✅ Test de connexion terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    console.error('Détails de l\'erreur:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Vérifiez que le serveur MySQL est démarré');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Suggestion: Vérifiez les identifiants de connexion');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Suggestion: Vérifiez que la base de données existe');
    }
  }
}

// Exécuter le test
testDatabaseConnection(); 