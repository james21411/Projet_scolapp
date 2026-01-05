const mysql = require('mysql2/promise');

// Fonction pour générer un ID selon le rôle (copie de la logique du service)
function generateUserIdByRole(role) {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  
  const rolePrefix = {
    'Admin': 'ADM',
    'Direction': 'DIR',
    'Comptable': 'COMP',
    'Enseignant': 'ENS',
    'Parent': 'PAR',
    'Élève': 'ELV'
  };
  
  const prefix = rolePrefix[role] || 'USR';
  return `${prefix}-${timestamp}-${random}`;
}

// Fonction pour générer un nom d'utilisateur selon le rôle
function generateUsernameByRole(fullName, role) {
  const nameSlug = fullName.toLowerCase()
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[ùû]/g, 'u')
    .replace(/[ôö]/g, 'o')
    .replace(/[îï]/g, 'i')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.');
  
  const timestamp = Date.now().toString().slice(-4);
  
  const rolePrefix = {
    'Admin': 'admin',
    'Direction': 'dir',
    'Comptable': 'compt',
    'Enseignant': 'ens',
    'Parent': 'parent',
    'Élève': 'eleve'
  };
  
  const prefix = rolePrefix[role] || 'user';
  return `${prefix}.${nameSlug}.${timestamp}`;
}

async function testUserIds() {
  console.log('Test de génération d\'identifiants par rôle:\n');
  
  const testUsers = [
    { fullName: 'Jean Dupont', role: 'Admin' },
    { fullName: 'Marie Martin', role: 'Direction' },
    { fullName: 'Pierre Durand', role: 'Comptable' },
    { fullName: 'Sophie Bernard', role: 'Enseignant' },
    { fullName: 'Paul Moreau', role: 'Parent' },
    { fullName: 'Emma Petit', role: 'Élève' }
  ];
  
  testUsers.forEach(user => {
    const userId = generateUserIdByRole(user.role);
    const username = generateUsernameByRole(user.fullName, user.role);
    
    console.log(`👤 ${user.fullName} (${user.role}):`);
    console.log(`   ID: ${userId}`);
    console.log(`   Username: ${username}`);
    console.log('');
  });
  
  console.log('✅ Test de génération terminé');
}

testUserIds(); 