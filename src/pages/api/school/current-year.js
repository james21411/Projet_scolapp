import pool from '@/db/mysql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [schoolInfo] = await pool.query(`
      SELECT currentSchoolYear
      FROM school_info
      LIMIT 1
    `);

    const currentYear = schoolInfo[0]?.currentSchoolYear || '2024-2025';

    return res.status(200).json({ 
      success: true, 
      data: currentYear 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'année scolaire:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'année scolaire'
    });
  }
} 