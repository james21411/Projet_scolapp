const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Nuttertools2.0',
      database: 'scolapp'
    });

    console.log('✅ Connexion MySQL réussie !');
    
    // Tester une requête simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Requête de test réussie:', rows);
    
    // Vérifier si la base fosilamaster existe
    const [databases] = await connection.execute('SHOW DATABASES');
    const fosilamasterExists = databases.some(db => db.Database === 'fosilamaster');
    console.log('📊 Base fosilamaster existe:', fosilamasterExists);
    
    if (fosilamasterExists) {
      // Vérifier les tables
      const [tables] = await connection.execute('SHOW TABLES');
      console.log('📋 Tables disponibles:', tables.map(t => Object.values(t)[0]));
    }
    
    await connection.end();
    console.log('✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    console.log('💡 Solutions possibles :');
    console.log('1. Vérifier que MySQL est démarré');
    console.log('2. Vérifier les identifiants de connexion');
    console.log('3. Vérifier que la base fosilamaster existe');
  }
}

testDatabaseConnection(); 