import { getPoolFromRequest } from '@/lib/pool-from-request';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cacheGetOrLoad, cacheInvalidate } from '@/lib/cache';

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

export default async function handler(req, res) {
  const { method } = req;

  try {
    const session = await getIronSession(req, res, sessionOptions);
    const dbName = session?.dbName || process.env.MYSQL_DATABASE || 'scolapp';
    const pool = await getPoolFromRequest(req, res);

    switch (method) {
      case 'GET': {
        const organizedSettings = await cacheGetOrLoad(
          dbName,
          'grading_settings',
          async () => {
            const [settings] = await pool.execute(
              'SELECT * FROM grading_settings WHERE isActive = true ORDER BY category, settingKey'
            );
            const result = {};
            settings.forEach(row => {
              if (!result[row.category]) result[row.category] = {};
              result[row.category][row.settingKey] = {
                value: row.settingValue,
                description: translations[row.settingKey] || row.description
              };
            });
            return result;
          },
          'grading_settings'
        );
        return res.status(200).json(organizedSettings);
      }

      case 'POST': {
        const { settingKey, settingValue, description, category } = req.body;
        await pool.execute(
          'INSERT INTO grading_settings (settingKey, settingValue, description, category) VALUES (?, ?, ?, ?)',
          [settingKey, settingValue, description, category]
        );
        cacheInvalidate(dbName, 'grading_settings');
        return res.status(201).json({ settingKey, settingValue, description, category });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API grading-settings:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
}