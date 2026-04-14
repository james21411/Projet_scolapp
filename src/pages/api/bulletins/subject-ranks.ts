import { NextApiRequest, NextApiResponse } from 'next';
import { getPoolFromRequest } from '@/lib/pool-from-request';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let connection;

  try {
    const { classId, evaluationPeriodId, schoolYear, studentId } = req.body;

    if (!classId || !evaluationPeriodId || !schoolYear) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const pool = await getPoolFromRequest(req, res);
    connection = await pool.getConnection();

    console.log('🔍 Récupération des rangs par matière pour:', {
      classId,
      evaluationPeriodId,
      schoolYear,
      studentId
    });

    // Récupérer le nom de la classe
    const [classInfoRaw] = await connection.query(
      'SELECT name FROM school_classes WHERE id = ?',
      [classId]
    );
    const classInfo = classInfoRaw as any[];
    if (classInfo.length === 0) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }
    const className = classInfo[0].name;
    console.log('🏫 Nom de la classe:', className);

    // Récupérer les informations de la période
    const [periodsRaw] = await connection.query(
      'SELECT * FROM evaluation_periods WHERE id = ? AND isActive = true',
      [evaluationPeriodId]
    );
    const periods = periodsRaw as any[];
    if (periods.length === 0) {
      return res.status(404).json({ error: 'Période non trouvée' });
    }
    const period = periods[0];
    const isTrimester = period.name.toLowerCase().includes('trim') || period.name.toLowerCase().includes('trimester');

    console.log('📅 Période:', period.name, 'Type:', isTrimester ? 'TRIMESTRE' : 'SÉQUENCE');

    // Récupérer tous les élèves de la classe
    const [allStudentsRaw] = await connection.query(
      'SELECT id, nom, prenom FROM students WHERE classe = ? AND anneeScolaire = ? ORDER BY nom, prenom',
      [className, schoolYear]
    );
    const allStudents = allStudentsRaw as any[];
    console.log('👥 Nombre d\'élèves dans la classe:', allStudents.length);

    // Récupérer toutes les matières de la classe
    const [classSubjectsRaw] = await connection.query(`
      SELECT 
        s.id,
        s.name,
        s.category,
        cs.coefficient
      FROM class_subjects cs
      JOIN subjects s ON cs.subjectId = s.id
      WHERE cs.className = ?
      AND cs.schoolYear = ?
    `, [className, schoolYear]);
    const classSubjects = classSubjectsRaw as any[];
    console.log('📚 Matières de la classe:', classSubjects.length);

    // Calculer les rangs par matière
    const ranksBySubject: { [subjectId: string]: { rank: number, totalStudents: number } } = {};

    for (const subject of classSubjects) {
      console.log(`🔍 Calcul du rang pour la matière: ${subject.name}`);

      // Récupérer les notes de tous les élèves pour cette matière
      const studentsWithGrades = [];

      for (const student of allStudents) {
        let studentSubjectAverage = 0;

        if (isTrimester) {
          // Pour les trimestres, récupérer les notes des 2 séquences
          const [sequencesRaw] = await connection.query(`
            SELECT id FROM evaluation_periods 
            WHERE schoolYear = ? AND type = 'sequence'
            ORDER BY name
            LIMIT 2
          `, [schoolYear]);
          const sequences = sequencesRaw as any[];
          if (sequences.length > 0) {
            // Récupérer les notes de la 1ère séquence
            const [seq1GradesRaw] = await connection.query(`
              SELECT score, maxScore
              FROM grades
              WHERE studentId = ? AND subjectId = ? AND evaluationPeriodId = ? AND schoolYear = ?
              AND score IS NOT NULL AND score != ''
            `, [student.id, subject.id, sequences[0].id, schoolYear]);
            const seq1Grades = seq1GradesRaw as any[];

            // Récupérer les notes de la 2ème séquence (si disponible)
            let seq2Grades: any[] = [];
            if (sequences.length > 1) {
              const [seq2GradesResultRaw] = await connection.query(`
                SELECT score, maxScore
                FROM grades
                WHERE studentId = ? AND subjectId = ? AND evaluationPeriodId = ? AND schoolYear = ?
                AND score IS NOT NULL AND score != ''
              `, [student.id, subject.id, sequences[1].id, schoolYear]);
              seq2Grades = seq2GradesResultRaw as any[];
            }

            // Calculer la moyenne des 2 séquences
            let totalScore = 0;
            let scoreCount = 0;

            if (seq1Grades.length > 0) {
              const score1 = parseFloat(seq1Grades[0].score);
              if (!isNaN(score1)) {
                totalScore += score1;
                scoreCount++;
              }
            }

            if (seq2Grades.length > 0) {
              const score2 = parseFloat(seq2Grades[0].score);
              if (!isNaN(score2)) {
                totalScore += score2;
                scoreCount++;
              }
            }

            studentSubjectAverage = scoreCount > 0 ? totalScore / scoreCount : 0;
          }
        } else {
          // Pour les séquences, récupérer la note directe
          const [gradesRaw] = await connection.query(`
            SELECT score, maxScore
            FROM grades
            WHERE studentId = ? AND subjectId = ? AND evaluationPeriodId = ? AND schoolYear = ?
            AND score IS NOT NULL AND score != ''
          `, [student.id, subject.id, evaluationPeriodId, schoolYear]);
          const grades = gradesRaw as any[];
          if (grades.length > 0) {
            const score = parseFloat(grades[0].score);
            const maxScore = parseFloat(grades[0].maxScore) || 20;
            studentSubjectAverage = (score / maxScore) * 20; // Normaliser sur 20
          }
        }

        if (studentSubjectAverage > 0) {
          studentsWithGrades.push({
            studentId: student.id,
            average: studentSubjectAverage
          });
        }
      }

      // Trier par moyenne décroissante et calculer le rang
      studentsWithGrades.sort((a, b) => b.average - a.average);

      // Trouver le rang de l'élève demandé
      const studentRank = studentsWithGrades.findIndex(s => s.studentId === parseInt(studentId)) + 1;

      ranksBySubject[subject.id] = {
        rank: studentRank > 0 ? studentRank : 1,
        totalStudents: studentsWithGrades.length
      };

      console.log(`🏆 Rang de l'élève ${studentId} en ${subject.name}: ${studentRank}/${studentsWithGrades.length}`);
    }
    console.log('✅ Rangs par matière calculés avec succès:', ranksBySubject);

    res.status(200).json({
      success: true,
      ranksBySubject,
      periodName: period.name,
      className,
      totalStudents: allStudents.length,
      isTrimester
    });

  } catch (error) {
    console.error('❌ Erreur lors du calcul des rangs par matière:', error);
    res.status(500).json({
      error: 'Erreur lors du calcul des rangs par matière',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

