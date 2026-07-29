const mysql = require('mysql2/promise');

async function migrateTranches() {
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

    console.log('🔍 Début de la migration des tranches...');

    // Récupérer toutes les structures tarifaires
    const [rows] = await connection.execute('SELECT * FROM fee_structures');
    
    for (const row of rows) {
      if (row.installments) {
        try {
          const installments = typeof row.installments === 'string' 
            ? JSON.parse(row.installments) 
            : row.installments;
          
          let hasChanges = false;
          const cleanedInstallments = installments.map((inst, index) => {
            // Si l'ID contient un timestamp, le remplacer par un ID simple
            let newId = inst.id;
            if (inst.id && typeof inst.id === 'string' && inst.id.includes('tranche')) {
              const match = inst.id.match(/tranche(\d+)/i);
              if (match) {
                newId = `tranche${match[1]}`;
              } else {
                // Si c'est un timestamp, créer un nouvel ID séquentiel
                newId = `tranche${index + 1}`;
                hasChanges = true;
              }
            } else if (!inst.id || inst.id.includes('tranche')) {
              newId = `tranche${index + 1}`;
              hasChanges = true;
            }
            
            // S'assurer que le nom de la tranche est correct
            const trancheName = inst.name || `Tranche ${index + 1}`;
            if (!inst.name) {
              hasChanges = true;
            }
            
            return {
              ...inst,
              id: newId,
              name: trancheName
            };
          });
          
          if (hasChanges) {
            // Mettre à jour la base de données
            await connection.execute(
              'UPDATE fee_structures SET installments = ? WHERE className = ?',
              [JSON.stringify(cleanedInstallments), row.className]
            );
            console.log(`✅ Migré: ${row.className} - ${cleanedInstallments.length} tranches nettoyées`);
          } else {
            console.log(`ℹ️  Déjà propre: ${row.className}`);
          }
          
        } catch (error) {
          console.error(`❌ Erreur lors de la migration de ${row.className}:`, error);
        }
      }
    }
    
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateTranches();
}

module.exports = { migrateTranches }; 