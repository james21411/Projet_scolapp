import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'PUT':
        // Mettre à jour un sujet
        const { code, name, category, coefficient, maxScore, isActive, classId, schoolYear } = req.body;
        
        await pool.execute(
          `UPDATE subjects 
           SET code = ?, name = ?, category = ?, coefficient = ?, maxScore = ?, isActive = ?, classId = ?, schoolYear = ?, updatedAt = NOW()
           WHERE id = ?`,
          [code || '', name || '', category || '', coefficient || 1, maxScore || 20, isActive !== undefined ? isActive : 1, classId || null, schoolYear || null, id]
        );
        
        return res.status(200).json({ 
          id,
          code,
          name,
          category,
          coefficient,
          maxScore,
          isActive,
          classId,
          schoolYear
        });

      case 'DELETE':
        // Supprimer définitivement un sujet
        await pool.execute(
          'DELETE FROM subjects WHERE id = ?',
          [id]
        );
        
        return res.status(200).json({ message: 'Sujet supprimé définitivement' });

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API subject-coefficients [id]:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
} 