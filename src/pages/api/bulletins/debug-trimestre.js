import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { classId, evaluationPeriodId, schoolYear } = req.body;

    if (!classId || !evaluationPeriodId || !schoolYear) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    console.log('🔍 === DEBUG TRIMESTRE ===');
    console.log(`🏫 Classe: ${classId}, Période: ${evaluationPeriodId}, Année: ${schoolYear}`);

    const connection = ;

    // Récupérer les informations de la période
    const [periods] = await connection.query(
      'SELECT * FROM evaluation_periods WHERE id = ?',
      [evaluationPeriodId]
    );

    const period = periods[0];
    console.log(`📝 Période trouvée:`, period);

    // Vérifier si c'est un trimestre
    const isTrimester = period && period.name && (period.name.toLowerCase().includes('trim') || period.name.toLowerCase().includes('trimestre'));
    
    if (!isTrimester) {      return res.status(400).json({ error: 'Cette API est uniquement pour les bulletins de trimestre' });
    }

    // Récupérer tous les élèves de la classe
    const [allStudents] = await connection.query(`
      SELECT * FROM students 
      WHERE classe = ? AND anneeScolaire = ?
      ORDER BY nom, prenom
    `, [classId, schoolYear]);

    console.log(`👥 ${allStudents.length} élèves trouvés pour la classe ${classId}`);

    // Récupérer les séquences pour ce trimestre
    const [sequences] = await connection.query(`
      SELECT id, name FROM evaluation_periods 
      WHERE schoolYear = ? AND type = 'sequence'
      ORDER BY name
      LIMIT 2
    `, [schoolYear]);

    console.log(`📚 Séquences trouvées:`, sequences);

    // Récupérer les notes et calculer les moyennes pour chaque élève
    const studentsGrades = await Promise.all(
      allStudents.map(async (student) => {
        let totalWeighted = 0;
        let totalCoeff = 0;
        const subjectGrades = [];

        // Récupérer les notes de la 1ère séquence
        if (sequences.length > 0) {
                                  const [seq1Grades] = await connection.query(`
               SELECT 
                 g.score,
                 g.subjectId,
                 s.name as subjectName,
                 s.category,
                 s.coefficient
               FROM grades g
               LEFT JOIN subjects s ON g.subjectId = s.id
               WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
             `, [student.id, sequences[0].id, schoolYear]);

                                // Récupérer les notes de la 2ème séquence
           let seq2Grades = [];
           if (sequences.length > 1) {
             const [seq2GradesResult] = await connection.query(`
               SELECT 
                 g.score,
                 g.subjectId,
                 s.name as subjectName,
                 s.category,
                 s.coefficient
               FROM grades g
               LEFT JOIN subjects s ON g.subjectId = s.id
               WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
             `, [student.id, sequences[1].id, schoolYear]);
             seq2Grades = seq2GradesResult;
           }

          // Combiner les notes des deux séquences
          const gradesBySubject = new Map();
          
          seq1Grades.forEach(grade => {
            gradesBySubject.set(grade.subjectId, {
              ...grade,
              seq1Score: parseFloat(grade.score) || 0,
              coef: parseFloat(grade.coefficient) || 1
            });
          });
          
          seq2Grades.forEach(grade => {
            if (gradesBySubject.has(grade.subjectId)) {
              const existing = gradesBySubject.get(grade.subjectId);
              existing.seq2Score = parseFloat(grade.score) || 0;
            } else {
              gradesBySubject.set(grade.subjectId, {
                ...grade,
                seq1Score: 0,
                seq2Score: parseFloat(grade.score) || 0,
                coef: parseFloat(grade.coefficient) || 1
              });
            }
          });

          // Calculer les moyennes et ajouter aux notes par matière
          gradesBySubject.forEach((grades, subjectId) => {
            const seq1Score = grades.seq1Score || 0;
            const seq2Score = grades.seq2Score || 0;
            const average = (seq1Score + seq2Score) / 2;
            const coef = grades.coef;
            
            totalWeighted += average * coef;
            totalCoeff += coef;

            subjectGrades.push({
              subjectName: grades.subjectName || 'Matière inconnue',
              seq1Score: seq1Score,
              seq2Score: seq2Score,
              coefficient: coef,
              rank: 1 // Sera calculé plus tard
            });
          });
        }

        const average = totalCoeff > 0 ? totalWeighted / totalCoeff : 0;

        return {
          studentId: student.id,
          studentName: `${student.nom} ${student.prenom}`,
          average: average,
          totalWeighted: totalWeighted,
          totalCoefficient: totalCoeff,
          subjectGrades: subjectGrades
        };
      })
    );

    // Calculer les rangs généraux
    const sortedStudents = studentsGrades.sort((a, b) => b.average - a.average);
    sortedStudents.forEach((student, index) => {
      student.rank = index + 1;
    });

    // Calculer les rangs par matière
    for (const student of studentsGrades) {
      for (const grade of student.subjectGrades) {
        // Récupérer toutes les notes pour cette matière
        const allSubjectGrades = studentsGrades.map(s => {
          const subjectGrade = s.subjectGrades.find(g => g.subjectName === grade.subjectName);
          return {
            studentId: s.studentId,
            score: subjectGrade ? (subjectGrade.seq1Score + subjectGrade.seq2Score) / 2 : 0
          };
        }).filter(g => g.score > 0);

        // Trier par score et calculer le rang
        const sortedSubjectGrades = allSubjectGrades.sort((a, b) => b.score - a.score);
        const subjectRank = sortedSubjectGrades.findIndex(g => g.studentId === student.studentId) + 1;
        grade.rank = subjectRank > 0 ? subjectRank : 1;
      }
    }

    const debugData = {
      className: classId,
      periodName: period.name,
      schoolYear: schoolYear,
      studentsCount: allStudents.length,
      sequences: sequences,
      studentsGrades: studentsGrades
    };

    console.log('✅ Données de débogage générées:', debugData);    res.status(200).json(debugData);

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
    return res.status(500).json({ 
      error: 'Erreur lors du débogage',
      details: error.message
    });
  }
}
