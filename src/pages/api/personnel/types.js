import pool from '@/db/mysql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [types] = await pool.query(`
      SELECT 
        id,
        name,
        description,
        color,
        icon,
        isActive,
        createdAt
      FROM personnel_types
      WHERE isActive = 1
      ORDER BY name
    `);

    return res.status(200).json({ 
      success: true, 
      data: types 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des types de personnel:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des types de personnel'
    });
  }
} 