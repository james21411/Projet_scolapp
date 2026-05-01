import { getPoolFromRequest } from '@/lib/pool-from-request';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const pool = await getPoolFromRequest(req, res);
    const { studentId, classId, schoolYear } = req.body;

    if (!studentId || !classId || !schoolYear) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    console.log(' === RÉCUPÉRATION DONNÉES ANNUELLES ===');
    console.log(` Élève: ${studentId}, Classe: ${classId}, Année: ${schoolYear}`);

    // Récupérer les moyennes des 3 trimestres
    const [trimesterResults] = await pool.query(`
      SELECT 
        rc.studentId,
        rc.averageScore,
        rc.studentRank,
        rc.totalStudents,
        ep.name as periodName,
        ep.id as periodId
      FROM report_cards rc
      JOIN evaluation_periods ep ON rc.evaluationPeriodId = ep.id
      WHERE rc.studentId = ? 
        AND rc.schoolYear = ?
        AND ep.name LIKE '%trimestre%'
      ORDER BY ep.name
    `, [studentId, schoolYear]);

    console.log(` Résultats trimestres trouvés:`, trimesterResults);

    if (trimesterResults.length < 3) {
      return res.status(400).json({
        error: `Données incomplètes. ${trimesterResults.length}/3 trimestres disponibles.`
      });
    }

    // Traiter les résultats par trimestre
    const trimesterAverages = trimesterResults.map((result, index) => {
      const trimesterNumber = index + 1;
      const average = parseFloat(result.averageScore) || 0;
      const rank = parseInt(result.studentRank) || 1;
      const totalStudents = parseInt(result.totalStudents) || 1;

      let mention = 'Insuffisant';
      if (average >= 18) mention = 'Excellent';
      else if (average >= 16) mention = 'Très Bien';
      else if (average >= 14) mention = 'Bien';
      else if (average >= 12) mention = 'Assez Bien';
      else if (average >= 10) mention = 'Passable';

      return { trimesterNumber, average, rank, totalStudents, mention, periodName: result.periodName };
    });

    const totalAverage = trimesterAverages.reduce((sum, t) => sum + t.average, 0);
    const annualAverage = totalAverage / 3;

    let finalDecision = 'NON ADMIS';
    if (annualAverage >= 10) finalDecision = 'ADMIS EN CLASSE SUPÉRIEURE';
    else if (annualAverage >= 8) finalDecision = 'ADMIS AVEC RÉSERVES';

    console.log(`📈 Moyenne annuelle: ${annualAverage.toFixed(2)}`);

    return res.status(200).json({
      annualAverage: Math.round(annualAverage * 100) / 100,
      finalDecision,
      trimesterAverages

  } catch (error) {
    console.error(' ❌ Erreur lors de la récupération des données annuelles:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des données annuelles',
      details: error.message
    });
  }
}
