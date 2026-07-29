import mysql from 'mysql2/promise';
import { spawn } from 'child_process';

// Configuration de la connexion MySQL avec gestion d'erreur
let poolConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
  database: process.env.MYSQL_DATABASE || 'scolapp',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 100,
  queueLimit: Number(process.env.MYSQL_QUEUE_LIMIT) || 5,
  // Options pour éviter les problèmes de connexion
  multipleStatements: true,
  dateStrings: true,
  charset: 'utf8mb4',
};

const createPool = () => {
  try {
    return mysql.createPool(poolConfig);
  } catch (error) {
    console.error('Erreur lors de la création du pool MySQL:', error);
    throw error;
  }
};

let pool = createPool();
let isResetting = false; // Flag to prevent concurrent resets

// Store original methods to avoid recursion in monitoring functions
let originalExecute = pool.execute.bind(pool);
let originalQuery = pool.query.bind(pool);
let originalGetConnection = pool.getConnection.bind(pool);

// Module-based connection tracking
// Usage: Call setCurrentModule('students') before API calls for students module
// Then call closeConnectionsForModule('oldModule') when switching to close old connections
let currentModule = 'default';
const moduleConnections = new Map(); // moduleId => Set of threadIds

export const setCurrentModule = (moduleId) => {
  currentModule = moduleId;
};

// Fonction pour redémarrer le serveur automatiquement
let restartScheduled = false; // Prevent multiple restart attempts

const restartServer = () => {
  if (restartScheduled) return;
  restartScheduled = true;

  console.log('🚨 Erreur "Too many connections" détectée - Redémarrage automatique du serveur dans 5 secondes...');

  setTimeout(() => {
    console.log('🔄 Redémarrage du serveur...');

    // En développement, tuer le processus pour que le dev server redémarre
    if (process.env.NODE_ENV !== 'production') {
      console.log('💀 Arrêt du processus de développement...');
      process.exit(1);
    } else {
      // En production, utiliser PM2 ou autre gestionnaire de processus
      console.log('🔄 Tentative de redémarrage en production...');
      process.exit(1);
    }
  }, 5000); // Attendre 5 secondes pour permettre aux requêtes en cours de se terminer
};

export const closeConnectionsForModule = async (moduleId) => {
  const threadIds = moduleConnections.get(moduleId);
  if (!threadIds || threadIds.size === 0) return;

  try {
    const connection = await originalGetConnection();
    for (const threadId of threadIds) {
      try {
        await connection.query('KILL ?', [threadId]);
        console.log(`🔪 Killed connection thread ${threadId} for module ${moduleId}`);
      } catch (error) {
        console.error(`Erreur lors de la fermeture de la connexion ${threadId}:`, error);
      }
    }
    connection.release();
    moduleConnections.delete(moduleId);
    console.log(`✅ Fermé ${threadIds.size} connexions pour le module ${moduleId}`);
  } catch (error) {
    console.error('Erreur lors de la fermeture des connexions pour le module:', error);
  }
};

// Fonction pour recréer le pool en cas d'erreur
const recreatePool = () => {
  try {
    if (pool) {
      pool.end().catch(err => {
        // Ignore errors if pool is already closed
        if (!err.message.includes('closed state')) {
          console.error('Erreur lors de la fermeture du pool:', err);
        }
      });
    }
    pool = createPool();
    // Re-bind originals after pool recreation
    originalExecute = pool.execute.bind(pool);
    originalQuery = pool.query.bind(pool);
    originalGetConnection = pool.getConnection.bind(pool);
    // Clear module connections tracking since thread IDs change
    moduleConnections.clear();
    console.log('Pool MySQL recréé avec succès');
  } catch (error) {
    console.error('Erreur lors de la recréation du pool MySQL:', error);
  }
};

// Fonction pour tester la connexion
export const testConnection = async () => {
  try {
    const connection = await originalGetConnection();
    await connection.ping();
    connection.release();
    console.log('Connexion MySQL établie avec succès');
    return true;
  } catch (error) {
    console.error('Erreur de connexion MySQL:', error);
    // Recréer le pool en cas d'erreur
    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.log('Trop de connexions, recréation du pool...');
      recreatePool();
    }
    return false;
  }
};

// Fonction pour nettoyer les connexions inactives
export const cleanupConnections = async () => {
  try {
    // Forcer la fermeture des connexions inactives
    await pool.end().catch(err => {
      // Ignore errors if pool is already closed
      if (!err.message.includes('closed state')) {
        console.error('Erreur lors de la fermeture du pool:', err);
      }
    });
    console.log('Pool MySQL fermé pour nettoyage');

    // Recréer le pool
    recreatePool();
    console.log('Pool MySQL recréé après nettoyage');
  } catch (error) {
    console.error('Erreur lors du nettoyage des connexions:', error);
  }
};

// Fonction pour obtenir les statistiques du pool
export const getPoolStats = () => {
  try {
    return {
      threadId: pool.threadId,
      connectionLimit: poolConfig.connectionLimit,
      queueLimit: poolConfig.queueLimit,
      // Note: mysql2 ne fournit pas directement les stats du pool
      // Ces infos sont utiles pour le debugging
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des stats du pool:', error);
    return null;
  }
};

// Fonction pour obtenir le nombre de connexions actives
export const getActiveConnections = async () => {
  try {
    const connection = await originalGetConnection();
    const [rows] = await connection.query('SHOW PROCESSLIST');
    connection.release();

    // Compter les connexions de cette application (basé sur le user)
    const user = process.env.MYSQL_USER || 'root';
    const userConnections = rows.filter(conn => conn.User === user);
    const activeConnections = userConnections.length;

    // Track thread IDs for current module
    if (!moduleConnections.has(currentModule)) {
      moduleConnections.set(currentModule, new Set());
    }
    const currentModuleSet = moduleConnections.get(currentModule);
    // Clear old ones and add current
    currentModuleSet.clear();
    userConnections.forEach(conn => currentModuleSet.add(conn.Id));

    console.log(`🔗 Connexions MySQL totales: ${activeConnections}/${poolConfig.connectionLimit} (module: ${currentModule}, pool: ${pool.size || 'N/A'})`);
    return activeConnections;
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de connexions actives:', error);
    return 0;
  }
};

// Fonction pour vérifier et réinitialiser automatiquement les connexions si nécessaire
export const checkAndResetConnections = async () => {
  try {
    const activeConnections = await getActiveConnections();
    const connectionLimit = poolConfig.connectionLimit;
    const threshold = Math.floor(connectionLimit * 0.8); // Reset à 80% pour prévention

    if (activeConnections >= threshold && !isResetting) {
      console.log(`⚠️ Seuil de connexions atteint (${activeConnections}/${connectionLimit}, seuil: ${threshold}), nettoyage de toutes les connexions...`);
      isResetting = true;
      try {
        // Tuer TOUTES les connexions pour l'utilisateur
        await killAllUserConnections();
        // Puis recréer notre pool
        await cleanupConnections();
        console.log('✅ Toutes les connexions nettoyées et pool réinitialisé');
        return true;
      } finally {
        isResetting = false;
      }
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des connexions:', error);
    isResetting = false; // Reset flag on error
    return false;
  }
};

// Fonction pour tuer toutes les connexions de l'utilisateur
const killAllUserConnections = async () => {
  try {
    const connection = await originalGetConnection();
    const [rows] = await connection.query('SHOW PROCESSLIST');
    connection.release();

    const user = process.env.MYSQL_USER || 'root';
    const userConnections = rows.filter(conn => conn.User === user && conn.Id !== connection.threadId);

    console.log(`🔪 Tuer ${userConnections.length} connexions pour l'utilisateur ${user}`);

    for (const conn of userConnections) {
      try {
        await connection.query('KILL ?', [conn.Id]);
      } catch (error) {
        // Ignore errors for already closed connections
        if (!error.message.includes('Unknown thread id')) {
          console.error(`Erreur lors de la fermeture de ${conn.Id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des connexions:', error);
  }
};

// Wrapper pour pool.execute avec monitoring automatique
pool.execute = async function(...args) {
  try {
    // Vérifier les connexions avant chaque requête
    await checkAndResetConnections();
    return await originalExecute(...args);
  } catch (error) {
    // Détecter l'erreur "Too many connections" et redémarrer le serveur
    if (error.code === 'ER_CON_COUNT_ERROR' || error.message.includes('Too many connections')) {
      console.error('🚨 Erreur "Too many connections" détectée dans pool.execute');
      restartServer();
    }
    throw error;
  }
};

// Wrapper pour pool.query avec monitoring automatique
pool.query = async function(...args) {
  try {
    // Vérifier les connexions avant chaque requête
    await checkAndResetConnections();
    return await originalQuery(...args);
  } catch (error) {
    // Détecter l'erreur "Too many connections" et redémarrer le serveur
    if (error.code === 'ER_CON_COUNT_ERROR' || error.message.includes('Too many connections')) {
      console.error('🚨 Erreur "Too many connections" détectée dans pool.query');
      restartServer();
    }
    throw error;
  }
};

// Wrapper pour pool.getConnection avec monitoring automatique
pool.getConnection = async function(...args) {
  try {
    // Vérifier les connexions avant d'obtenir une nouvelle connexion
    await checkAndResetConnections();
    return await originalGetConnection(...args);
  } catch (error) {
    // Détecter l'erreur "Too many connections" et redémarrer le serveur
    if (error.code === 'ER_CON_COUNT_ERROR' || error.message.includes('Too many connections')) {
      console.error('🚨 Erreur "Too many connections" détectée dans pool.getConnection');
      restartServer();
    }
    throw error;
  }
};

export default pool;
