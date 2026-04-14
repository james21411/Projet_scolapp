import { getPoolFromRequest } from '@/lib/pool-from-request';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const pool = await getPoolFromRequest(req, res);
    const connection = pool;
    const { classId, subjectId, evaluationPeriodId, schoolYear } = req.query;

    console.log('🔍 Debug grades - Paramètres reçus:', { classId, subjectId, evaluationPeriodId, schoolYear });

    // 1. Compter le total des notes
    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM grades');
    const totalNotes = totalResult[0].total;

    // 2. Compter les notes par contexte
    let contextQuery = 'SELECT COUNT(*) as count FROM grades WHERE 1=1';
    const contextParams = [];

    if (classId) {
      contextQuery += ' AND classId = ?';
      contextParams.push(classId);
    }

    if (schoolYear) {
      contextQuery += ' AND schoolYear = ?';
      contextParams.push(schoolYear);
    }

    if (subjectId) {
      contextQuery += ' AND subjectId = ?';
      contextParams.push(subjectId);
    }

    if (evaluationPeriodId) {
      contextQuery += ' AND evaluationPeriodId = ?';
      contextParams.push(evaluationPeriodId);
    }

    const [contextResult] = await pool.execute(contextQuery, contextParams);
    const contextNotes = contextResult[0].count;

    // 3. Récupérer quelques exemples de notes pour ce contexte
    let examplesQuery = `
      SELECT 
        g.id,
        g.studentId,
        g.classId,
        g.schoolYear,
        g.subjectId,
        g.evaluationPeriodId,
        g.score,
        g.maxScore,
        g.coefficient,
        g.weightedScore,
        s.name as subjectName
      FROM grades g
      LEFT JOIN subjects s ON g.subjectId = s.id
      WHERE 1=1
    `;

    if (classId) examplesQuery += ' AND g.classId = ?';
    if (schoolYear) examplesQuery += ' AND g.schoolYear = ?';
    if (subjectId) examplesQuery += ' AND g.subjectId = ?';
    if (evaluationPeriodId) examplesQuery += ' AND g.evaluationPeriodId = ?';

    examplesQuery += ' ORDER BY g.id DESC LIMIT 10';

    const [examples] = await pool.execute(examplesQuery, contextParams);

    // 4. Vérifier les sujets disponibles pour cette classe
    let subjectsQuery = `
      SELECT id, name, code, classId, schoolYear
      FROM subjects
      WHERE 1=1
    `;
    const subjectParams = [];

    if (classId) {
      subjectsQuery += ' AND classId = ?';
      subjectParams.push(classId);
    }

    if (schoolYear) {
      subjectsQuery += ' AND schoolYear = ?';
      subjectParams.push(schoolYear);
    }

    const [subjects] = await pool.execute(subjectsQuery, subjectParams);

    // 5. Vérifier les périodes d'évaluation
    const [periods] = await pool.execute('SELECT id, name, schoolYear FROM evaluation_periods ORDER BY schoolYear DESC, name');
    return res.status(200).json({
      summary: {
        totalNotes,
        contextNotes,
        filters: { classId, subjectId, evaluationPeriodId, schoolYear }
      },
      examples,
      subjects,
      periods,
      contextQuery: contextQuery.replace(/\s+/g, ' ').trim(),
      contextParams
    });

  } catch (error) {
    console.error('❌ Erreur debug grades:', error);
    return res.status(500).json({
      error: 'Erreur lors du debug des notes',
      details: error.message
    });
  }
}
