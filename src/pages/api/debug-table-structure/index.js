import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const connection = ;
    
    // 1. Voir la structure de la table grades
    const [gradesStructure] = await pool.execute('DESCRIBE grades');
    
    // 2. Voir quelques exemples de notes existantes
    const [sampleGrades] = await pool.execute('SELECT * FROM grades LIMIT 3');
    
    // 3. Voir la structure de la table subjects
    const [subjectsStructure] = await pool.execute('DESCRIBE subjects');
    
    // 4. Voir la structure de la table evaluation_types
    const [evaluationTypesStructure] = await pool.execute('DESCRIBE evaluation_types');
    
    // 5. Voir quelques types d'évaluation
    const [evaluationTypes] = await pool.execute('SELECT * FROM evaluation_types LIMIT 5');    return res.status(200).json({
      gradesStructure,
      sampleGrades,
      subjectsStructure,
      evaluationTypesStructure,
      evaluationTypes
    });
    
  } catch (error) {
    console.error('❌ Erreur debug table structure:', error);
    return res.status(500).json({ 
      error: 'Erreur lors du debug de la structure des tables',
      details: error.message 
    });
  }
}
