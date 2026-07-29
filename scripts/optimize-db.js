#!/usr/bin/env node

/**
 * Script d'optimisation de la base de données MySQL
 * Crée les index nécessaires pour améliorer les performances
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function optimizeDatabase() {
  let connection;

  try {
    console.log('🚀 === OPTIMISATION DE LA BASE DE DONNÉES ===\n');

    // Configuration de la connexion
    const config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
      database: process.env.MYSQL_DATABASE || 'scolapp',
      multipleStatements: true
    };

    console.log('📡 Connexion à la base de données...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion établie\n');

    // Lire le fichier SQL d'optimisation
    const sqlFilePath = path.join(__dirname, 'optimize-database.sql');
    console.log('📖 Lecture du script d\'optimisation...');

    const sqlScript = await fs.readFile(sqlFilePath, 'utf8');
    console.log('✅ Script chargé\n');

    // Diviser le script en commandes individuelles
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`🔧 Exécution de ${commands.length} commandes d'optimisation...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Ignorer les commentaires et les commandes vides
      if (command.startsWith('--') || command.trim() === '') {
        continue;
      }

      try {
        console.log(`⚙️  Commande ${i + 1}/${commands.length}: ${command.substring(0, 60)}...`);

        // Vérifier si c'est une commande CREATE INDEX qui pourrait déjà exister
        if (command.toUpperCase().includes('CREATE INDEX')) {
          const indexName = command.match(/CREATE INDEX (\w+)/i)?.[1];
          if (indexName) {
            // Vérifier si l'index existe déjà
            const [existingIndexes] = await connection.execute(
              'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND INDEX_NAME = ? LIMIT 1',
              [config.database, indexName]
            );

            if (existingIndexes.length > 0) {
              console.log(`   ⏭️  Index ${indexName} existe déjà, ignoré`);
              continue;
            }
          }
        }

        await connection.execute(command);
        console.log(`   ✅ Exécutée avec succès`);
        successCount++;

      } catch (error) {
        // Ignorer les erreurs d'index dupliqué
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`   ⏭️  Index existe déjà, ignoré`);
          successCount++;
        } else {
          console.log(`   ❌ Erreur: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 === RÉSULTATS DE L'OPTIMISATION ===`);
    console.log(`✅ Commandes réussies: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);

    if (successCount > 0) {
      console.log('\n🎉 Optimisation terminée avec succès!');
      console.log('Les performances de la base de données ont été améliorées.');
    }

    // Afficher les statistiques finales
    console.log('\n📈 Statistiques des tables après optimisation:');
    const [tableStats] = await connection.execute(`
      SELECT
        TABLE_NAME,
        TABLE_ROWS,
        ROUND(DATA_LENGTH/1024/1024, 2) as DATA_MB,
        ROUND(INDEX_LENGTH/1024/1024, 2) as INDEX_MB,
        ROUND((DATA_LENGTH + INDEX_LENGTH)/1024/1024, 2) as TOTAL_MB
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      LIMIT 10
    `, [config.database]);

    console.table(tableStats);

  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Fonction pour analyser les requêtes lentes
async function analyzeSlowQueries() {
  console.log('\n🔍 === ANALYSE DES REQUÊTES LENTES ===');

  let connection;

  try {
    const config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    };

    connection = await mysql.createConnection(config);

    // Activer le slow query log temporairement
    await connection.execute('SET GLOBAL slow_query_log = 1');
    await connection.execute('SET GLOBAL long_query_time = 1'); // 1 seconde

    console.log('✅ Slow query log activé (seuil: 1 seconde)');
    console.log('Les requêtes lentes seront enregistrées dans le log MySQL');

  } catch (error) {
    console.error('❌ Erreur lors de l\'activation du slow query log:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter l'optimisation
if (require.main === module) {
  optimizeDatabase()
    .then(() => {
      console.log('\n💡 Conseils pour maintenir les performances:');
      console.log('1. Exécutez ce script après les insertions massives de données');
      console.log('2. Surveillez les requêtes lentes avec EXPLAIN');
      console.log('3. Archivez les anciennes données régulièrement');
      console.log('4. Effectuez des sauvegardes régulières');

      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Échec de l\'optimisation:', error);
      process.exit(1);
    });
}

module.exports = { optimizeDatabase, analyzeSlowQueries };