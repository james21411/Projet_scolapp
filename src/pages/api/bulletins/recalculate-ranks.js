import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let connection;

  try {
    const { classId, evaluationPeriodId, schoolYear } = req.body;

    if (!classId || !evaluationPeriodId || !schoolYear) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    console.log('=== RECALCUL AUTOMATIQUE DES RANGS ===');

    connection = await pool.getConnection();

    // 1. Récupérer tous les élèves de la classe
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE classe = (SELECT name FROM school_classes WHERE id = ?) AND anneeScolaire = ?',
      [classId, schoolYear]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Aucun élève trouvé' });
    }

    // 2. Calculer les moyennes pour chaque élève
    const studentAverages = [];

    for (const student of students) {
      // Récupérer les notes avec les coefficients corrects depuis subjects
      const [grades] = await pool.execute(`
        SELECT 
          g.score, 
          g.maxScore, 
          s.coefficient
        FROM grades g
        LEFT JOIN subjects s ON g.subjectId = s.id
        WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
      `, [student.id, evaluationPeriodId, schoolYear]);

      if (grades.length > 0) {
        let totalWeightedScore = 0;
        let totalCoefficient = 0;

        for (const grade of grades) {
          const score = parseFloat(grade.score) || 0;
          const maxScore = parseFloat(grade.maxScore) || 20;
          const coefficient = parseFloat(grade.coefficient) || 1;

          if (maxScore > 0) {
            const normalizedScore = (score / maxScore) * 20;
            totalWeightedScore += normalizedScore * coefficient;
            totalCoefficient += coefficient;
          }
        }

        const average = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;
        
        console.log(`📊 Élève ${student.id}: moyenne = ${average.toFixed(2)}, totalWeighted = ${totalWeightedScore.toFixed(2)}, totalCoef = ${totalCoefficient}`);
        
        studentAverages.push({
          studentId: student.id,
          average: average,
          gradesCount: grades.length
        });
      } else {
        studentAverages.push({
          studentId: student.id,
          average: 0,
          gradesCount: 0
        });
      }
    }

    // 3. Trier par moyenne décroissante
    console.log('📊 Moyennes calculées AVANT tri:', studentAverages);
    
    const sortedAverages = studentAverages.sort((a, b) => b.average - a.average);
    console.log('🏆 Moyennes APRÈS tri (décroissant):', sortedAverages);
    
    const totalStudents = sortedAverages.length;

    // 4. Mettre à jour les bulletins
    let successCount = 0;

    for (let i = 0; i < sortedAverages.length; i++) {
      const student = sortedAverages[i];
      const rank = i + 1;

      try {
        const [existingBulletins] = await pool.execute(`
          SELECT id FROM report_cards 
          WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
        `, [student.studentId, evaluationPeriodId, schoolYear]);

        if (existingBulletins.length > 0) {
          // Calculer le totalCoefficient pour cet élève
          const [studentGrades] = await pool.execute(`
            SELECT s.coefficient
            FROM grades g
            LEFT JOIN subjects s ON g.subjectId = s.id
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [student.studentId, evaluationPeriodId, schoolYear]);
          
          const totalCoefficient = studentGrades.reduce((sum, grade) => sum + parseFloat(grade.coefficient || 1), 0);
          
          await pool.execute(`
            UPDATE report_cards 
            SET studentRank = ?, totalStudents = ?, averageScore = ?, totalCoefficient = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
          `, [rank, totalStudents, student.average, totalCoefficient, student.studentId, evaluationPeriodId, schoolYear]);
        } else {
          const bulletinId = `bulletin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Calculer le totalCoefficient pour cet élève
          const [studentGrades] = await pool.execute(`
            SELECT s.coefficient
            FROM grades g
            LEFT JOIN subjects s ON g.subjectId = s.id
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [student.studentId, evaluationPeriodId, schoolYear]);
          
          const totalCoefficient = studentGrades.reduce((sum, grade) => sum + parseFloat(grade.coefficient || 1), 0);
          
          // Vérifier s'il existe un utilisateur système ou admin
          let issuedBy = 'SYSTEM';
          try {
            const [users] = await pool.execute('SELECT id FROM users LIMIT 1');
            if (users.length > 0) {
              issuedBy = users[0].id;
            }
          } catch (userError) {
            console.log('⚠️ Impossible de récupérer un utilisateur, utilisation de SYSTEM');
          }
          
          await pool.execute(`
            INSERT INTO report_cards (
              id, studentId, classId, schoolYear, evaluationPeriodId,
              averageScore, totalCoefficient, studentRank, totalStudents,
              teacherComments, principalComments, mention, issuedBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            bulletinId, student.studentId, classId, schoolYear, evaluationPeriodId,
            student.average, totalCoefficient, rank, totalStudents,
            '', '', 'N/A', issuedBy
          ]);
        }
        successCount++;
      } catch (error) {
        console.error(`Erreur pour l'élève ${student.studentId}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Rangs recalculés pour ${successCount}/${totalStudents} élèves`,
      totalStudents,
      successCount
    });

  } catch (error) {
    console.error('Erreur lors du recalcul des rangs:', error);
    return res.status(500).json({
      error: 'Erreur serveur interne',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
