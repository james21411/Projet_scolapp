import { getPoolFromRequest } from '@/lib/pool-from-request';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cacheGetOrLoad, cacheInvalidate } from '@/lib/cache';

export default async function handler(req, res) {
  const { method } = req;

  try {
    const session = await getIronSession(req, res, sessionOptions);
    const dbName = session?.dbName || process.env.MYSQL_DATABASE || 'scolapp';
    const pool = await getPoolFromRequest(req, res);

    switch (method) {
      case 'GET': {
        const { schoolYear, type: periodType } = req.query;

        const cacheKey = `evaluation_periods:${schoolYear || 'all'}:${periodType || 'all'}`;

        const periods = await cacheGetOrLoad(
          dbName,
          cacheKey,
          async () => {
            let query = `
              SELECT ep.*,
                COUNT(DISTINCT g.studentId) as gradedStudents,
                COUNT(DISTINCT s.id) as totalStudents
              FROM evaluation_periods ep
              LEFT JOIN students s ON s.anneeScolaire = ep.schoolYear
              LEFT JOIN grades g ON g.evaluationPeriodId = ep.id AND g.studentId = s.id
              WHERE ep.isActive = true
            `;
            const params = [];
            if (schoolYear) { query += ' AND ep.schoolYear = ?'; params.push(schoolYear); }
            if (periodType) { query += ' AND ep.type = ?'; params.push(periodType); }
            query += ' GROUP BY ep.id ORDER BY ep.`order`, ep.startDate';

            const [rows] = await pool.execute(query, params);
            return rows;
          },
          'evaluation_periods'
        );

        return res.status(200).json(periods);
      }

      case 'POST': {
        const { name, type, startDate, endDate, schoolYear: newSchoolYear, order: periodOrder } = req.body;
        const periodId = `period-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await pool.execute(
          'INSERT INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, `order`) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [periodId, name, type, startDate, endDate, newSchoolYear, periodOrder]
        );

        // Invalider le cache des périodes
        cacheInvalidate(dbName, `evaluation_periods:${newSchoolYear}:all`);
        cacheInvalidate(dbName, `evaluation_periods:all:all`);

        return res.status(201).json({ id: periodId, message: 'Période d\'évaluation créée avec succès' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API evaluation-periods:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: error.message });
  }
}