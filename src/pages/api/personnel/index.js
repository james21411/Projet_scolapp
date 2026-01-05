import pool from '@/db/mysql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [personnel] = await pool.query(`
      SELECT 
        p.id,
        p.username,
        p.fullName,
        p.email,
        p.phone,
        p.role,
        p.type_personnel,
        p.dateEmbauche,
        p.typeContrat,
        p.salaire,
        p.statut,
        p.specialite,
        p.diplome,
        p.experience,
        p.photoUrl,
        p.personnelTypeId,
        p.createdAt,
        pt.name as typeName,
        pt.color as typeColor
      FROM personnel p
      LEFT JOIN personnel_types pt ON p.personnelTypeId = pt.id
      ORDER BY p.fullName
    `);

    return res.status(200).json({ 
      success: true, 
      data: personnel 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du personnel:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du personnel'
    });
  }
} 