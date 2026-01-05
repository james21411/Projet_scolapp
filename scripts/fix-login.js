const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixLoginIssues() {
  console.log('🔧 Correction des problèmes de connexion...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Nuttertools2.0',
      database: 'scolapp'
    });

    console.log('✅ Connexion MySQL réussie !');
    
    // 1. Vérifier les utilisateurs existants
    const [users] = await connection.execute('SELECT id, username, passwordHash, role FROM users');
    console.log('📋 Utilisateurs trouvés:', users.length);
    
    // 2. Créer un mot de passe par défaut pour les utilisateurs qui n'en ont pas
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // 3. Mettre à jour les mots de passe manquants ou incorrects
    for (const user of users) {
      console.log(`🔍 Vérification de l'utilisateur: ${user.username} (${user.id})`);
      
      // Vérifier si le mot de passe existe et est valide
      if (!user.passwordHash || user.passwordHash === 'temp-hash' || user.passwordHash.length < 10) {
        console.log(`🔧 Mise à jour du mot de passe pour ${user.username}`);
        await connection.execute(
          'UPDATE users SET passwordHash = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
      }
    }
    
    // 4. Créer un utilisateur admin par défaut s'il n'existe pas
    const [adminExists] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );
    
    if (adminExists.length === 0) {
      console.log('🔧 Création d\'un utilisateur admin par défaut');
      await connection.execute(
        'INSERT INTO users (id, username, fullName, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
        ['admin-default', 'admin', 'Administrateur', hashedPassword, 'Admin']
      );
    }
    
    // 5. Afficher les informations de connexion
    console.log('\n📋 Informations de connexion:');
    console.log('👤 Utilisateurs disponibles:');
    
    const [updatedUsers] = await connection.execute('SELECT username, role FROM users ORDER BY role, username');
    updatedUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role})`);
    });
    
    console.log('\n🔑 Mot de passe par défaut pour tous les utilisateurs: admin123');
    console.log('\n💡 Testez avec:');
    console.log('   - Username: admin');
    console.log('   - Password: admin123');
    
    await connection.end();
    console.log('\n✅ Correction terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
  }
}

fixLoginIssues(); 