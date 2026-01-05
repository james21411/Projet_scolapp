#!/usr/bin/env node

/**
 * Script pour vérifier l'état des connexions à la base de données
 * Affiche le nombre de connexions actives et les statistiques du pool
 */

import { getActiveConnections, getPoolStats, checkAndResetConnections } from '../src/db/mysql-pool.js';

async function main() {
  console.log('🔍 Vérification des connexions à la base de données...\n');

  try {
    // Obtenir le nombre de connexions actives
    const activeConnections = await getActiveConnections();

    // Obtenir les statistiques du pool
    const poolStats = getPoolStats();

    console.log('\n📊 Statistiques du pool MySQL:');
    console.log(`   - Limite de connexions: ${poolStats?.connectionLimit || 'N/A'}`);
    console.log(`   - Limite de file d'attente: ${poolStats?.queueLimit || 'N/A'}`);
    console.log(`   - Thread ID: ${poolStats?.threadId || 'N/A'}`);

    // Vérifier si on doit réinitialiser
    const wasReset = await checkAndResetConnections();

    if (wasReset) {
      console.log('\n⚠️ Les connexions ont été automatiquement réinitialisées.');
    } else {
      console.log('\n✅ Les connexions sont dans les limites normales.');
    }

    console.log('\n🎯 Surveillance terminée.');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des connexions:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});