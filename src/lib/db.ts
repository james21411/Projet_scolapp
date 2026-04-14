/**
 * @file lib/db.ts
 * 
 * Re-export du pool dynamique multi-tenant depuis src/db/mysql.ts.
 * Tous les services qui importent depuis '@/lib/db' bénéficient automatiquement
 * de l'isolation par tenant (la DB correcte est choisie selon la session).
 */
import pool, { getCurrentDbName, getPoolForDb } from '@/db/mysql';

export async function query(sql: string, params?: any[]): Promise<any> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erreur de base de données:', error);
    throw error;
  }
}

export async function getConnection() {
  return await pool.getConnection();
}

export async function closePool() {
  // no-op : les pools sont gérés dans db/mysql.ts
}

export { getCurrentDbName, getPoolForDb };
export default pool;
