export default async function handler(req, res) {
  const { method } = req;

  try {
  // Use shared pool to avoid too many connections
  const pool = require('../../../db/mysql').default;

    switch (method) {
      case 'GET':
        // Récupérer les périodes d'évaluation
        const { schoolYear, type: periodType } = req.query;
        
        let query = `
          SELECT 
            ep.*,
            COUNT(DISTINCT g.studentId) as gradedStudents,
            COUNT(DISTINCT s.id) as totalStudents
          FROM evaluation_periods ep
          LEFT JOIN students s ON s.anneeScolaire = ep.schoolYear
          LEFT JOIN grades g ON g.evaluationPeriodId = ep.id AND g.studentId = s.id
          WHERE ep.isActive = true
        `;
        const params = [];
        
        if (schoolYear) {
          query += ' AND ep.schoolYear = ?';
          params.push(schoolYear);
        }
        
        if (periodType) {
          query += ' AND ep.type = ?';
          params.push(periodType);
        }
        
        query += ' GROUP BY ep.id ORDER BY ep.order, ep.startDate';
        
  const [periods] = await pool.execute(query, params);
        return res.status(200).json(periods);

      case 'POST':
        // Créer une nouvelle période d'évaluation
        const { 
          name, 
          type, 
          startDate, 
          endDate, 
          schoolYear: newSchoolYear,
          order: periodOrder
        } = req.body;

        const periodId = `period-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const insertQuery = `
          INSERT INTO evaluation_periods (
            id, name, type, startDate, endDate, schoolYear, \`order\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

  await pool.execute(insertQuery, [
          periodId, name, type, startDate, endDate, newSchoolYear, periodOrder
        ]);
        
        return res.status(201).json({ 
          id: periodId,
          message: 'Période d\'évaluation créée avec succès'
        });

      default:
        
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API evaluation-periods:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur interne',
      details: error.message
    });
  }
} 