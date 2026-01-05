import mysql from 'mysql2/promise';

// Configuration de la connexion MySQL avec gestion d'erreur
const createPool = () => {
  try {
    return mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
      database: process.env.MYSQL_DATABASE || 'scolapp',
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || (process.env.NODE_ENV === 'production' ? 100 : 20),
      queueLimit: Number(process.env.MYSQL_QUEUE_LIMIT) || (process.env.NODE_ENV === 'production' ? 50 : 10),
      // Options pour éviter les problèmes de connexion
      multipleStatements: true,
      dateStrings: true,
      charset: 'utf8mb4',
      connectTimeout: 60000, // 60 seconds
    });
  } catch (error) {
    console.error('Erreur lors de la création du pool MySQL:', error);
    throw error;
  }
};

let pool = createPool();

// Fonction pour recréer le pool en cas d'erreur
const recreatePool = () => {
  try {
    if (pool) {
      pool.end();
    }
    pool = createPool();
    console.log('Pool MySQL recréé avec succès');
  } catch (error) {
    console.error('Erreur lors de la recréation du pool MySQL:', error);
  }
};

// Fonction pour tester la connexion
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('Connexion MySQL établie avec succès');
    return true;
  } catch (error: any) {
    console.error('Erreur de connexion MySQL:', error);
    // Recréer le pool en cas d'erreur
    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.log('Trop de connexions, recréation du pool...');
      recreatePool();
    }
    return false;
  }
};

// Fonction pour valider une connexion avant utilisation
export const validateConnection = async (connection: any) => {
  try {
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Connexion invalide détectée:', error);
    return false;
  }
};

// Fonction pour nettoyer les connexions inactives
export const cleanupConnections = async () => {
  try {
    // Forcer la fermeture des connexions inactives
    await pool.end();
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
      connectionLimit: pool.config.connectionLimit,
      queueLimit: pool.config.queueLimit,
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
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SHOW PROCESSLIST') as [any[], any];
    connection.release();

    // Compter les connexions de cette application (basé sur le user)
    const user = process.env.MYSQL_USER || 'root';
    const activeConnections = rows.filter((conn: any) => conn.User === user).length;

    console.log(`🔗 Nombre de connexions actives: ${activeConnections}/${pool.config.connectionLimit}`);
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
    const connectionLimit = pool.config.connectionLimit || 20;
    const threshold = connectionLimit - 1; // n-1 comme demandé

    if (activeConnections >= threshold) {
      console.log(`⚠️ Seuil de connexions atteint (${activeConnections}/${connectionLimit}), réinitialisation automatique...`);
      await cleanupConnections();
      console.log('✅ Pool de connexions réinitialisé automatiquement');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des connexions:', error);
    return false;
  }
};

// Note: Les wrappers automatiques ont été supprimés pour éviter les erreurs TypeScript
// Utilisez checkAndResetConnections() manuellement dans vos API si nécessaire

export default pool; 