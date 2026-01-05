import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { studentId, classId, schoolYear } = req.body;

    if (!studentId || !classId || !schoolYear) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    console.log('🚀 === RÉCUPÉRATION DONNÉES ANNUELLES ===');
    console.log(`👤 Élève: ${studentId}, Classe: ${classId}, Année: ${schoolYear}`);

    const connection = ;

    // Récupérer les moyennes des 3 trimestres
    const [trimesterResults] = await connection.query(`
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

    console.log(`📊 Résultats trimestres trouvés:`, trimesterResults);

    if (trimesterResults.length < 3) {      return res.status(400).json({ 
        error: `Données incomplètes. ${trimesterResults.length}/3 trimestres disponibles.` 
      });
    }

    // Traiter les résultats par trimestre
    const trimesterAverages = trimesterResults.map((result, index) => {
      const trimesterNumber = index + 1;
      const average = parseFloat(result.averageScore) || 0;
      const rank = parseInt(result.studentRank) || 1;
      const totalStudents = parseInt(result.totalStudents) || 1;
      
      // Calculer la mention
      let mention = 'Insuffisant';
      if (average >= 18) mention = 'Excellent';
      else if (average >= 16) mention = 'Très Bien';
      else if (average >= 14) mention = 'Bien';
      else if (average >= 12) mention = 'Assez Bien';
      else if (average >= 10) mention = 'Passable';

      return {
        trimesterNumber,
        average,
        rank,
        totalStudents,
        mention,
        periodName: result.periodName
      };
    });

    // Calculer la moyenne annuelle
    const totalAverage = trimesterAverages.reduce((sum, t) => sum + t.average, 0);
    const annualAverage = totalAverage / 3;

    // Décision finale basée sur la moyenne annuelle
    let finalDecision = 'NON ADMIS';
    if (annualAverage >= 10) {
      finalDecision = 'ADMIS EN CLASSE SUPÉRIEURE';
    } else if (annualAverage >= 8) {
      finalDecision = 'ADMIS AVEC RÉSERVES';
    }

    console.log(`📈 Moyenne annuelle calculée: ${annualAverage.toFixed(2)}`);
    console.log(`🎯 Décision finale: ${finalDecision}`);

    const result = {
      annualAverage: Math.round(annualAverage * 100) / 100, // Arrondir à 2 décimales
      finalDecision,
      trimesterAverages
    };    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données annuelles:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la récupération des données annuelles',
      details: error.message
    });
  }
}
