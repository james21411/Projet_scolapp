/**
 * Module de surveillance des connexions à la base de données
 * Fournit des fonctions pour monitorer et gérer automatiquement les connexions
 */

import { getActiveConnections, checkAndResetConnections } from '../db/mysql-pool.js';

/**
 * Démarre la surveillance périodique des connexions
 * @param {number} intervalMinutes - Intervalle en minutes entre les vérifications
 */
export function startConnectionMonitoring(intervalMinutes = 5) {
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`🔍 Surveillance des connexions démarrée (intervalle: ${intervalMinutes} minutes)`);

  // Vérification immédiate au démarrage
  setTimeout(async () => {
    try {
      await checkAndResetConnections();
    } catch (error) {
      console.error('❌ Erreur lors de la vérification initiale des connexions:', error);
    }
  }, 10000); // 10 secondes après le démarrage

  // Surveillance périodique
  const monitoringInterval = setInterval(async () => {
    try {
      console.log(`\n🔄 Vérification périodique des connexions (${new Date().toLocaleTimeString()})`);
      await checkAndResetConnections();
    } catch (error) {
      console.error('❌ Erreur lors de la surveillance périodique des connexions:', error);
    }
  }, intervalMs);

  // Fonction pour arrêter la surveillance
  const stopMonitoring = () => {
    clearInterval(monitoringInterval);
    console.log('🛑 Surveillance des connexions arrêtée');
  };

  return { stopMonitoring };
}

/**
 * Fonction utilitaire pour afficher l'état actuel des connexions
 */
export async function logConnectionStatus() {
  try {
    const activeConnections = await getActiveConnections();
    const timestamp = new Date().toLocaleString();

    console.log(`📊 [${timestamp}] État des connexions: ${activeConnections} actives`);

    return activeConnections;
  } catch (error) {
    console.error('❌ Erreur lors de la journalisation de l\'état des connexions:', error);
    return 0;
  }
}

/**
 * Vérifie si les connexions sont proches de la limite et émet un avertissement
 */
export async function checkConnectionHealth() {
  try {
    const activeConnections = await getActiveConnections();
    const connectionLimit = process.env.MYSQL_CONNECTION_LIMIT || 10;
    const warningThreshold = Math.floor(connectionLimit * 0.8); // 80% de la limite

    if (activeConnections >= warningThreshold) {
      console.warn(`⚠️ ATTENTION: ${activeConnections}/${connectionLimit} connexions actives (${Math.round((activeConnections/connectionLimit)*100)}%)`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de santé des connexions:', error);
    return false;
  }
}