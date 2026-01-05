import mysql from 'mysql2/promise';

// Configuration de la base de données
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'scolapp',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction query pour exécuter des requêtes SQL
export async function query(sql: string, params?: any[]): Promise<any> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erreur de base de données:', error);
    throw error;
  }
}

// Fonction pour obtenir une connexion
export async function getConnection() {
  return await pool.getConnection();
}

// Fonction pour fermer le pool
export async function closePool() {
  await pool.end();
}

export default pool;
