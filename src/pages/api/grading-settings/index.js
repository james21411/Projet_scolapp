import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  const { method } = req;

  try {
    const connection = ;

    switch (method) {
      case 'GET':
        // Récupérer tous les paramètres de notation
        const [settings] = await pool.execute(
          'SELECT * FROM grading_settings WHERE isActive = true ORDER BY category, settingKey'
        );
        
        // Organiser par catégorie avec traductions
        const organizedSettings = {};
        const translations = {
          'auto_calculate_averages': 'Calcul automatique des moyennes',
          'coefficient_calculation': 'Méthode de calcul des coefficients',
          'decimal_precision': 'Précision décimale pour les notes',
          'default_max_score': 'Note maximale par défaut',
          'default_passing_score': 'Note de passage par défaut',
          'enable_ranking': 'Activer le classement des élèves',
          'enable_weighted_averages': 'Activer les moyennes pondérées',
          'evaluation_periods': 'Périodes d\'évaluation',
          'grade_scale': 'Échelle de notation par lettres',
          'grade_validation': 'Validation stricte des notes'
        };
        
        settings.forEach(row => {
          if (!organizedSettings[row.category]) {
            organizedSettings[row.category] = {};
          }
          organizedSettings[row.category][row.settingKey] = {
            value: row.settingValue,
            description: translations[row.settingKey] || row.description
          };
        });        return res.status(200).json(organizedSettings);

      case 'POST':
        // Ajouter un nouveau paramètre
        const { settingKey, settingValue, description, category } = req.body;
        
        const [result] = await pool.execute(
          `INSERT INTO grading_settings (settingKey, settingValue, description, category) 
           VALUES (?, ?, ?, ?)`,
          [settingKey, settingValue, description, category]
        );        return res.status(201).json({ settingKey, settingValue, description, category });

      default:        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API grading-settings:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
} 