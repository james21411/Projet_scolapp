import { getPoolFromRequest } from '@/lib/pool-from-request';

// Fonction pour initialiser les notes manquantes à 0 pour une matière spécifique
async function initializeMissingGradesToZeroForSubject(pool, connection, classId, subjectId, evaluationPeriodId, schoolYear, recordedBy) {
  try {
    console.log(`🔄 Initialisation des notes manquantes à 0 pour la matière ${subjectId}...`);

    // Récupérer tous les élèves de la classe
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE classe = ?',
      [classId]
    );

    if (students.length === 0) {
      console.log('⚠️ Aucun élève trouvé dans cette classe');
      return;
    }

    // Récupérer les informations de la matière
    const [subjects] = await pool.execute(
      'SELECT id, coefficient, maxScore FROM subjects WHERE id = ? AND classId = ? AND schoolYear = ?',
      [subjectId, classId, schoolYear]
    );

    if (subjects.length === 0) {
      console.log('⚠️ Matière non trouvée pour cette classe');
      return;
    }

    const subject = subjects[0];

    // Récupérer le type d'évaluation utilisé (seq1 par défaut)
    const evaluationTypeId = 'seq1';

    let initializedCount = 0;

    // Pour chaque élève, vérifier s'il y a une note pour cette matière
    for (const student of students) {
      // Vérifier si une note existe déjà
      const [existingGrade] = await pool.execute(
        'SELECT id FROM grades WHERE studentId = ? AND subjectId = ? AND evaluationTypeId = ? AND evaluationPeriodId = ? AND classId = ? AND schoolYear = ?',
        [student.id, subjectId, evaluationTypeId, evaluationPeriodId, classId, schoolYear]
      );

      if (existingGrade.length === 0) {
        // Pas de note, créer une note à 0
        const gradeId = `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const weightedScore = 0; // Note à 0

        await pool.execute(
          'INSERT INTO grades (id, studentId, subjectId, evaluationTypeId, evaluationPeriodId, score, maxScore, coefficient, weightedScore, classId, schoolYear, recordedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [gradeId, student.id, subjectId, evaluationTypeId, evaluationPeriodId, 0, subject.maxScore, subject.coefficient, weightedScore, classId, schoolYear, recordedBy]
        );

        initializedCount++;
        console.log(`✅ Note initialisée à 0 pour élève ${student.id}, matière ${subjectId}`);
      }
    }

    console.log(`✅ ${initializedCount} notes manquantes initialisées à 0 pour la matière ${subjectId}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des notes manquantes:', error);
    throw error;
  }
}

// Fonction pour recalculer automatiquement les rangs après modification des notes
async function recalculateRanksAfterGradeUpdate(pool, connection, classId, evaluationPeriodId, schoolYear) {
  try {
    console.log('🏆 Recalcul automatique des rangs après modification des notes...');

    // Récupérer tous les élèves de la classe
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE classe = ?',
      [classId]
    );

    if (students.length === 0) {
      console.log('⚠️ Aucun élève trouvé dans cette classe, recalcul des rangs ignoré');
      return;
    }

    // Calculer les moyennes pour chaque élève
    const studentAverages = [];

    for (const student of students) {
      const [grades] = await pool.execute(`
        SELECT 
          g.score, 
          g.maxScore, 
          g.coefficient,
          s.coefficient as subjectCoefficient
        FROM grades g
        LEFT JOIN subjects s ON g.subjectId = s.id
        WHERE g.studentId = ? 
        AND g.evaluationPeriodId = ? 
        AND g.classId = ?
        AND g.schoolYear = ?
      `, [student.id, evaluationPeriodId, classId, schoolYear]);

      if (grades.length > 0) {
        let totalWeightedScore = 0;
        let totalCoefficient = 0;

        grades.forEach(grade => {
          const coef = grade.subjectCoefficient || grade.coefficient || 1;
          const normalizedScore = grade.maxScore > 0 ? (grade.score / grade.maxScore) * 20 : 0;
          totalWeightedScore += normalizedScore * coef;
          totalCoefficient += coef;
        });

        const average = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;
        studentAverages.push({
          studentId: student.id,
          average: average
        });
      }
    }

    // Trier par moyenne décroissante pour calculer les rangs
    const sortedAverages = studentAverages.sort((a, b) => b.average - a.average);
    console.log('📊 Moyennes triées pour le recalcul des rangs:', sortedAverages);

    // Mettre à jour les bulletins avec les nouveaux rangs
    for (let i = 0; i < sortedAverages.length; i++) {
      const student = sortedAverages[i];
      const rank = i + 1;
      const totalStudents = sortedAverages.length;

      // Vérifier si un bulletin existe déjà
      const [existingBulletins] = await pool.execute(`
        SELECT id FROM report_cards 
        WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
      `, [student.studentId, evaluationPeriodId, schoolYear]);

      if (existingBulletins.length > 0) {
        // Mettre à jour le bulletin existant
        await pool.execute(`
          UPDATE report_cards 
          SET rank = ?, totalStudents = ?, averageScore = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
        `, [rank, totalStudents, student.average, student.studentId, evaluationPeriodId, schoolYear]);

        console.log(`✅ Rang mis à jour pour ${student.studentId}: ${rank}/${totalStudents}`);
      } else {
        // Créer un nouveau bulletin
        const bulletinId = `bulletin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await pool.execute(`
          INSERT INTO report_cards (
            id, studentId, classId, schoolYear, evaluationPeriodId,
            averageScore, totalCoefficient, rank, totalStudents,
            teacherComments, principalComments, mention, issuedBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          bulletinId, student.studentId, classId, schoolYear, evaluationPeriodId,
          student.average, 0, rank, totalStudents,
          '', '', 'N/A', 'SYSTEM'
        ]);

        console.log(`✅ Nouveau bulletin créé pour ${student.studentId}: rang ${rank}/${totalStudents}`);
      }
    }

    console.log('✅ Rangs recalculés automatiquement avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du recalcul automatique des rangs:', error);
    // Ne pas faire échouer la sauvegarde des notes à cause du recalcul des rangs
  }
}

export default async function handler(req, res) {
  const { method } = req;
  let connection;

  try {
    const pool = await getPoolFromRequest(req, res);
    connection = await pool.getConnection();

    switch (method) {
      case 'GET':
        // Récupérer les notes avec filtres
        const { studentId, classId, schoolYear, subjectId, evaluationPeriodId } = req.query;

        console.log('🔍 API grades - Paramètres reçus:', { studentId, classId, schoolYear, subjectId, evaluationPeriodId });
        console.log('🔍 Types des paramètres:', {
          studentId: typeof studentId,
          classId: typeof classId,
          schoolYear: typeof schoolYear,
          subjectId: typeof subjectId,
          evaluationPeriodId: typeof evaluationPeriodId
        });

        let query = `
          SELECT 
            g.id,
            g.studentId,
            g.subjectId,
            g.evaluationPeriodId,
            g.score,
            g.maxScore,
            g.coefficient,
            g.weightedScore,
            g.classId,
            g.schoolYear,
            s.name as subjectName,
            s.coefficient as subjectCoefficient,
            s.maxScore as subjectMaxScore
          FROM grades g
          LEFT JOIN subjects s ON g.subjectId = s.id
          WHERE 1=1
        `;
        const params = [];

        if (classId && classId !== 'all') {
          console.log('🔍 Filtrage par classId:', classId);
          query += ' AND g.classId = ?';
          params.push(classId);
        }

        if (studentId) {
          console.log('🔍 Filtrage par studentId:', studentId);
          query += ' AND g.studentId = ?';
          params.push(studentId);
        }

        if (schoolYear) {
          console.log('🔍 Filtrage par schoolYear:', schoolYear);
          query += ' AND g.schoolYear = ?';
          params.push(schoolYear);
        }

        if (subjectId) {
          console.log('🔍 Filtrage par subjectId:', subjectId);
          query += ' AND g.subjectId = ?';
          params.push(subjectId);
        }

        if (evaluationPeriodId && evaluationPeriodId !== 'Annuel') {
          console.log('🔍 Filtrage par evaluationPeriodId:', evaluationPeriodId);
          query += ' AND g.evaluationPeriodId = ?';
          params.push(evaluationPeriodId);
        }

        query += ' ORDER BY g.studentId, g.subjectId';

        console.log('🔍 Requête SQL:', query);
        console.log('🔍 Paramètres:', params);

        const [grades] = await pool.execute(query, params);
        console.log('📦 Notes trouvées:', grades.length);
        console.log('🔍 Détail des notes trouvées:', grades.map(g => ({
          id: g.id,
          studentId: g.studentId,
          subjectId: g.subjectId,
          score: g.score,
          classId: g.classId,
          schoolYear: g.schoolYear,
          evaluationPeriodId: g.evaluationPeriodId
        })));
        return res.status(200).json(grades);

      case 'POST':
        // Sauvegarder ou mettre à jour les notes
        const { grades: gradesData, recordedBy } = req.body;

        if (!gradesData || !Array.isArray(gradesData) || gradesData.length === 0) {
          return res.status(400).json({ error: 'Données de notes invalides' });
        }

        console.log('🔍 Sauvegarde de', gradesData.length, 'notes...');
        console.log('🔍 Données reçues:', gradesData);

        const results = [];
        let classIdForRecalc = null;
        let evaluationPeriodIdForRecalc = null;
        let schoolYearForRecalc = null;

        for (const gradeData of gradesData) {
          const {
            studentId: newStudentId,
            subjectId: newSubjectId,
            evaluationTypeId: newEvaluationTypeId,
            evaluationPeriodId: newEvaluationPeriodId,
            score: newScore,
            maxScore: newMaxScore,
            coefficient: newCoefficient,
            classId: newClassId,
            schoolYear: newSchoolYear
          } = gradeData;

          // Stocker les informations pour le recalcul des rangs
          if (!classIdForRecalc) classIdForRecalc = newClassId;
          if (!evaluationPeriodIdForRecalc) evaluationPeriodIdForRecalc = newEvaluationPeriodId;
          if (!schoolYearForRecalc) schoolYearForRecalc = newSchoolYear;

          console.log('🔍 Traitement note:', {
            newStudentId, newSubjectId, newEvaluationTypeId, newEvaluationPeriodId, newScore, newMaxScore, newCoefficient, newClassId, newSchoolYear
          });

          // Validation des paramètres
          if (!newStudentId || !newSubjectId || !newEvaluationTypeId || !newEvaluationPeriodId ||
            newScore === undefined || newMaxScore === undefined ||
            !newCoefficient || !newClassId || !newSchoolYear) {
            console.log('❌ Paramètres manquants pour une note');
            continue; // Passer à la note suivante
          }

          // Vérifier si la note existe déjà
          console.log('🔍 Vérification existence note avec:', {
            newStudentId, newSubjectId, newEvaluationTypeId, newEvaluationPeriodId, newClassId
          });

          const [existing] = await pool.execute(
            'SELECT * FROM grades WHERE studentId = ? AND subjectId = ? AND evaluationTypeId = ? AND evaluationPeriodId = ? AND classId = ?',
            [newStudentId, newSubjectId, newEvaluationTypeId, newEvaluationPeriodId, newClassId]
          );

          console.log('🔍 Note existante trouvée:', existing.length > 0 ? existing[0] : 'Aucune');

          if (existing.length > 0) {
            // Mettre à jour la note existante
            const weightedScore = newMaxScore > 0 ? (newScore / newMaxScore) * 20 * newCoefficient : 0;
            await pool.execute(
              'UPDATE grades SET score = ?, maxScore = ?, coefficient = ?, weightedScore = ? WHERE id = ?',
              [newScore, newMaxScore, newCoefficient, weightedScore, existing[0].id]
            );

            results.push({
              action: 'updated',
              id: existing[0].id,
              studentId: newStudentId,
              subjectId: newSubjectId
            });

            console.log('✅ Note mise à jour:', existing[0].id);
          } else {
            // Créer une nouvelle note
            const weightedScore = newMaxScore > 0 ? (newScore / newMaxScore) * 20 * newCoefficient : 0;

            // Générer un ID unique pour la nouvelle note
            const newGradeId = `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const [result] = await pool.execute(
              'INSERT INTO grades (id, studentId, subjectId, evaluationTypeId, evaluationPeriodId, score, maxScore, coefficient, weightedScore, classId, schoolYear, recordedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [newGradeId, newStudentId, newSubjectId, newEvaluationTypeId, newEvaluationPeriodId, newScore, newMaxScore, newCoefficient, weightedScore, newClassId, newSchoolYear, recordedBy]
            );

            results.push({
              action: 'created',
              id: result.insertId,
              studentId: newStudentId,
              subjectId: newSubjectId
            });

            console.log('✅ Note créée:', result.insertId);
          }
        } // Fin de la boucle for

        // 🔥 NOUVEAU : Initialiser les notes manquantes à 0 pour cette matière et période
        if (classIdForRecalc && evaluationPeriodIdForRecalc && schoolYearForRecalc) {
          console.log('🔄 Initialisation des notes manquantes à 0...');
          try {
            // Récupérer la matière de la première note pour initialiser seulement cette matière
            const firstGrade = gradesData[0];
            if (firstGrade && firstGrade.subjectId) {
              await initializeMissingGradesToZeroForSubject(pool, connection, classIdForRecalc, firstGrade.subjectId, evaluationPeriodIdForRecalc, schoolYearForRecalc, recordedBy);
            }
          } catch (error) {
            console.log('⚠️ Erreur lors de l\'initialisation des notes manquantes (non bloquant):', error.message);
          }
        }

        // 🔥 NOUVEAU : Recalcul automatique des rangs après modification des notes
        if (classIdForRecalc && evaluationPeriodIdForRecalc && schoolYearForRecalc) {
          console.log('🔄 Déclenchement du recalcul automatique des rangs...');
          try {
            await recalculateRanksAfterGradeUpdate(pool, connection, classIdForRecalc, evaluationPeriodIdForRecalc, schoolYearForRecalc);
          } catch (error) {
            console.log('⚠️ Erreur lors du recalcul des rangs (non bloquant):', error.message);
            // Ne pas faire échouer la sauvegarde des notes à cause du recalcul des rangs
          }
        }

        // Retourner le résumé de toutes les opérations
        return res.status(200).json({
          message: `${results.length} notes traitées`,
          results: results,
          ranksRecalculated: true
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ Erreur API grades:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 