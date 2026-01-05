import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  const { method } = req;
  const { key } = req.query;

  try {
    const connection = ;

    switch (method) {
      case 'GET':
        // Récupérer un paramètre spécifique
        const [settings] = await pool.execute(
          'SELECT * FROM grading_settings WHERE settingKey = ? AND isActive = true',
          [key]
        );        if (settings.length === 0) {
          return res.status(404).json({ error: 'Paramètre non trouvé' });
        }
        
        return res.status(200).json(settings[0]);

      case 'PUT':
        // Mettre à jour un paramètre
        const { settingValue, description } = req.body;
        
        let query = 'UPDATE grading_settings SET settingValue = ?, updatedAt = NOW() WHERE settingKey = ?';
        const params = [settingValue, key];
        
        if (description) {
          query = 'UPDATE grading_settings SET settingValue = ?, description = ?, updatedAt = NOW() WHERE settingKey = ?';
          params.splice(1, 0, description);
        }
        
        const [updateResult] = await pool.execute(query, params);        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Paramètre non trouvé' });
        }
        
        return res.status(200).json({ settingKey: key, settingValue, description });

      default:        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API grading-setting:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
} 