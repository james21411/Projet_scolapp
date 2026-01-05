import pool from './mysql';

// Fonction utilitaire pour exécuter des requêtes avec retry automatique
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = [], 
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [rows] = await pool.query(query, params);
      return rows as T;
    } catch (error: any) {
      lastError = error;
      
      // Si c'est une erreur de connexion, attendre et réessayer
      if (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'ECONNRESET') {
        console.log(`Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative dans 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // Pour les autres erreurs, ne pas réessayer
      throw error;
    }
  }
  
  // Si toutes les tentatives ont échoué
  throw lastError;
}

// Fonction pour obtenir une connexion avec retry
export async function getConnection(maxRetries: number = 3) {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.getConnection();
    } catch (error: any) {
      lastError = error;
      
      if (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'ECONNRESET') {
        console.log(`Tentative de connexion ${attempt}/${maxRetries} échouée, nouvelle tentative dans 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

export async function executeTransaction<T = any>(
  queries: Array<{ query: string; params?: any[] }>
): Promise<T[]> {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const results: T[] = [];
    for (const { query, params = [] } of queries) {
      const [rows] = await connection.execute(query, params);
      results.push(rows as T);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Erreur lors de l\'exécution de la transaction:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 