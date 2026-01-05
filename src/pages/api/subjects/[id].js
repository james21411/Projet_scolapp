import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    const connection = ;

    switch (method) {
      case 'GET':
        // Récupérer une matière par ID
        const [subjects] = await pool.execute(
          'SELECT * FROM subjects WHERE id = ? AND isActive = true',
          [id]
        );        if (subjects.length === 0) {
          return res.status(404).json({ error: 'Matière non trouvée' });
        }
        
        return res.status(200).json(subjects[0]);

      case 'PUT':
        // Mettre à jour une matière
        const { name, code, description, category } = req.body;
        
        const [updateResult] = await pool.execute(
          `UPDATE subjects 
           SET name = ?, code = ?, description = ?, category = ?, updatedAt = NOW() 
           WHERE id = ?`,
          [name, code, description, category, id]
        );        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Matière non trouvée' });
        }
        
        return res.status(200).json({ id, name, code, description, category });

      case 'DELETE':
        // Désactiver une matière (soft delete)
        const [deleteResult] = await pool.execute(
          'UPDATE subjects SET isActive = false, updatedAt = NOW() WHERE id = ?',
          [id]
        );        if (deleteResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Matière non trouvée' });
        }
        
        return res.status(200).json({ message: 'Matière désactivée avec succès' });

      default:        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API subject:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
} 