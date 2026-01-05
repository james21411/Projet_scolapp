import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

// Fonction pour formater les rangs en français
function formatRank(rank: number): string {
  if (rank === 1) return '1er';
  if (rank === 2) return '2ème';
  if (rank === 3) return '3ème';
  return `${rank}ème`;
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, period, schoolYear, className } = await request.json();

    if (!studentId || !period || !schoolYear || !className) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    console.log('🚀 === GÉNÉRATION BULLETIN INDIVIDUEL ===');
    console.log(`👤 Élève: ${studentId}, Période: ${period}, Année: ${schoolYear}, Classe: ${className}`);

    const connection = await pool.getConnection();

    try {
      // Récupérer les informations de l'élève

      const [students] = await connection.query(
        'SELECT * FROM students WHERE id = ? AND classe = ? AND anneeScolaire = ?',
        [studentId, className, schoolYear]
      ) as [any[], any];

      if (students.length === 0) {
        return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
      }

      const student = students[0];

      // Récupérer l'ID de la période d'évaluation
      const [periods] = await connection.query(
        'SELECT id, name, type FROM evaluation_periods WHERE name = ? AND schoolYear = ? AND isActive = true',
        [period, schoolYear]
      ) as [any[], any];

      if (periods.length === 0) {
        return NextResponse.json({ error: 'Période non trouvée' }, { status: 404 });
      }

      const evaluationPeriod = periods[0];
      const isTrimester = evaluationPeriod.name.toLowerCase().includes('trim') || evaluationPeriod.name.toLowerCase().includes('trimester');

      console.log(`📝 Type de période: ${isTrimester ? 'TRIMESTRE' : 'SÉQUENCE'}`);

      // Récupérer les appréciations sauvegardées
      const [savedComments] = await connection.query(
        'SELECT teacherComments, principalComments FROM report_cards WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?',
        [studentId, evaluationPeriod.id, schoolYear]
      ) as [any[], any];

      let teacherComments = '';
      let principalComments = '';

      if (savedComments.length > 0) {
        teacherComments = savedComments[0].teacherComments || '';
        principalComments = savedComments[0].principalComments || '';
      }

      let grades: any[] = [];
      let studentAverage = 0;

      if (isTrimester) {
        // Pour les trimestres, récupérer les notes des séquences correspondantes
  const [sequences] = await connection.query(`
          SELECT id, name FROM evaluation_periods 
          WHERE schoolYear = ? AND type = 'sequence'
          ORDER BY name
          LIMIT 2
  `, [schoolYear]) as [any[], any];

        console.log(`📚 Séquences trouvées pour le trimestre: ${sequences.map((s: any) => s.name).join(', ')}`);

        if (sequences.length >= 2) {
          // Récupérer les notes de la 1ère séquence
          const [seq1Grades] = await connection.query(`
            SELECT 
              g.*,
              s.name as subjectName,
              s.category,
              s.coefficient,
              ep.name as periodName
            FROM grades g
            LEFT JOIN subjects s ON g.subjectId = s.id
            LEFT JOIN evaluation_periods ep ON g.evaluationPeriodId = ep.id
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [studentId, sequences[0].id, schoolYear]) as [any[], any];

          // Récupérer les notes de la 2ème séquence
          const [seq2Grades] = await connection.query(`
            SELECT 
              g.*,
              s.name as subjectName,
              s.category,
              s.coefficient,
              ep.name as periodName
            FROM grades g
            LEFT JOIN subjects s ON g.subjectId = s.id
            LEFT JOIN evaluation_periods ep ON g.evaluationPeriodId = ep.id
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [studentId, sequences[1].id, schoolYear]) as [any[], any];

          // Combiner les notes des deux séquences
          const gradesBySubject = new Map();

          seq1Grades.forEach((grade: any) => {
            gradesBySubject.set(grade.subjectId, {
              ...grade,
              seq1Score: parseFloat(grade.score) || 0,
              seq1MaxScore: parseFloat(grade.maxScore) || 20
            });
          });

          seq2Grades.forEach((grade: any) => {
            if (gradesBySubject.has(grade.subjectId)) {
              const existing = gradesBySubject.get(grade.subjectId);
              existing.seq2Score = parseFloat(grade.score) || 0;
              existing.seq2MaxScore = parseFloat(grade.maxScore) || 20;
            } else {
              gradesBySubject.set(grade.subjectId, {
                ...grade,
                seq1Score: 0,
                seq1MaxScore: 20,
                seq2Score: parseFloat(grade.score) || 0,
                seq2MaxScore: parseFloat(grade.maxScore) || 20
              });
            }
          });

          grades = Array.from(gradesBySubject.values());
        }
      } else {
        // Pour les séquences, récupérer les notes directes
  const [gradesResult] = await connection.query(`
          SELECT 
            g.*,
            s.name as subjectName,
            s.category,
            s.coefficient,
            ep.name as periodName
          FROM grades g
          LEFT JOIN subjects s ON g.subjectId = s.id
          LEFT JOIN evaluation_periods ep ON g.evaluationPeriodId = ep.id
          WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
  `, [studentId, evaluationPeriod.id, schoolYear]) as [any[], any];

        grades = gradesResult;
      }

      // Calculer la moyenne de l'élève
      let totalWeightedScore = 0;
      let totalCoefficient = 0;

      grades.forEach((grade: any) => {
        let score = 0;
        let maxScore = 20;

        if (isTrimester) {
          const seq1Score = grade.seq1Score || 0;
          const seq2Score = grade.seq2Score || 0;
          score = (seq1Score + seq2Score) / 2;
          maxScore = Math.max(grade.seq1MaxScore || 20, grade.seq2MaxScore || 20);
        } else {
          score = parseFloat(grade.score) || 0;
          maxScore = parseFloat(grade.maxScore) || 20;
        }

        const coef = parseFloat(grade.coefficient) || 1;
        totalWeightedScore += score * coef;
        totalCoefficient += coef;
      });

      studentAverage = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;

      // Récupérer tous les élèves de la classe pour calculer le rang
      const [allClassStudents] = await connection.query(
        'SELECT id FROM students WHERE classe = ? AND anneeScolaire = ? AND statut = "Actif"',
        [className, schoolYear]
      ) as [any[], any];

      // Calculer les moyennes de tous les élèves pour déterminer le rang
      const studentAverages = await Promise.all(
        allClassStudents.map(async (s: any) => {
          let totalWeighted = 0;
          let totalCoeff = 0;

          if (isTrimester) {
            const [sequences] = await connection.query(`
              SELECT id FROM evaluation_periods 
              WHERE schoolYear = ? AND type = 'sequence'
              ORDER BY name
              LIMIT 2
            `, [schoolYear]) as [any[], any];

            if (sequences.length > 0) {
              const [seq1Grades] = await connection.query(`
                SELECT 
                  g.score,
                  g.coefficient
                FROM grades g
                WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
              `, [s.id, sequences[0].id, schoolYear]) as [any[], any];

              let seq2Grades: any[] = [];
              if (sequences.length > 1) {
                const [seq2GradesResult] = await connection.query(`
                  SELECT 
                    g.score,
                    g.coefficient
                  FROM grades g
                  WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
                `, [s.id, sequences[1].id, schoolYear]) as [any[], any];
                seq2Grades = seq2GradesResult;
              }

              const gradesBySubject = new Map();

              seq1Grades.forEach((grade: any) => {
                gradesBySubject.set(grade.subjectId, {
                  seq1Score: parseFloat(grade.score) || 0,
                  coef: parseFloat(grade.coefficient) || 1
                });
              });

              seq2Grades.forEach((grade: any) => {
                if (gradesBySubject.has(grade.subjectId)) {
                  const existing = gradesBySubject.get(grade.subjectId);
                  existing.seq2Score = parseFloat(grade.score) || 0;
                } else {
                  gradesBySubject.set(grade.subjectId, {
                    seq1Score: 0,
                    seq2Score: parseFloat(grade.score) || 0,
                    coef: parseFloat(grade.coefficient) || 1
                  });
                }
              });

              gradesBySubject.forEach((subjectGrades: any) => {
                const average = (subjectGrades.seq1Score + subjectGrades.seq2Score) / 2;
                totalWeighted += average * subjectGrades.coef;
                totalCoeff += subjectGrades.coef;
              });
            }
          } else {
            const [grades] = await connection.query(`
              SELECT 
                g.score,
                g.coefficient
              FROM grades g
              WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
            `, [s.id, evaluationPeriod.id, schoolYear]) as [any[], any];

            grades.forEach((grade: any) => {
              const score = parseFloat(grade.score) || 0;
              const coef = parseFloat(grade.coefficient) || 1;
              totalWeighted += score * coef;
              totalCoeff += coef;
            });
          }

          const average = totalCoeff > 0 ? totalWeighted / totalCoeff : 0;
          return { studentId: s.id, average };
        })
      );

      // Trier par moyenne décroissante et calculer le rang
      studentAverages.sort((a, b) => b.average - a.average);
      const studentRank = studentAverages.findIndex(s => s.studentId === studentId) + 1;

      console.log(`📊 Moyenne de l'élève: ${studentAverage.toFixed(2)}/20`);
      console.log(`🏆 Rang de l'élève: ${studentRank}/${allClassStudents.length}`);

      const reportData = {
        student: {
          id: student.id,
          nom: student.nom,
          prenom: student.prenom,
          classe: student.classe,
          anneeScolaire: student.anneeScolaire,
          statut: student.statut
        },
        grades: grades.map((grade: any) => ({
          subjectId: grade.subjectId,
          subjectName: grade.subjectName,
          seq1Score: grade.seq1Score || 0,
          seq1MaxScore: grade.seq1MaxScore || 20,
          seq2Score: grade.seq2Score || 0,
          seq2MaxScore: grade.seq2MaxScore || 20,
          coefficient: parseFloat(grade.coefficient) || 1,
          periodName: grade.periodName
        })),
        average: studentAverage,
        rank: studentRank,
        totalStudents: allClassStudents.length,
        teacherComments,
        principalComments
      };

      return NextResponse.json(reportData);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Erreur lors de la génération du bulletin individuel:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
