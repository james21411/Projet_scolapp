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

    const currentYear = await cacheGetOrLoad(
      dbName,
      'school_current_year',
      async () => {
        const [rows] = await pool.query('SELECT currentSchoolYear FROM school_info LIMIT 1');
        return rows[0]?.currentSchoolYear || '2024-2025';
      },
      'school_info'
    );

    return res.status(200).json({ success: true, data: currentYear });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'année scolaire:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l\'année scolaire' });
  }
}