import { getPoolFromRequest } from '@/lib/pool-from-request';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cacheGetOrLoad } from '@/lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getIronSession(req, res, sessionOptions);
    const dbName = session?.dbName || process.env.MYSQL_DATABASE || 'scolapp';
    const pool = await getPoolFromRequest(req, res);

    const types = await cacheGetOrLoad(
      dbName,
      'personnel_types',
      async () => {
        const [rows] = await pool.query(
          'SELECT id, name, description, color, icon, isActive, createdAt FROM personnel_types WHERE isActive = 1 ORDER BY name'
        );
        return rows;
      },
      'personnel_types'
    );

    return res.status(200).json({ success: true, data: types });
  } catch (error) {
    console.error('Erreur lors de la récupération des types de personnel:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des types de personnel' });
  }
}