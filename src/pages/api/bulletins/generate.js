import pool from '../../../db/mysql-pool';
import PDFDocument from 'pdfkit';

// Fonction pour formater les rangs en français
function formatRank(rank) {
  if (rank === 1) return '1er';
  if (rank === 2) return '2ème';
  if (rank === 3) return '3ème';
  return `${rank}ème`;
}

// (chargement d'images en ligne retiré à la demande)

// Fonction pour logger les informations de diagnostic des rangs
async function logRankDiagnostics(connection, classId, schoolYear, evaluationPeriodId, isTrimester) {
  console.log('\n🔍 === DIAGNOSTIC COMPLET DES RANGS ===');
  console.log(`📊 Classe: ${classId}, Année: ${schoolYear}, Période: ${evaluationPeriodId}`);
  console.log(`📝 Type: ${isTrimester ? 'TRIMESTRE' : 'SÉQUENCE'}`);
  
  try {
    // Récupérer tous les élèves de la classe
    const [allStudents] = await connection.query(
      'SELECT id, nom, prenom, classe FROM students WHERE classe = (SELECT name FROM school_classes WHERE id = ?) AND anneeScolaire = ? ORDER BY nom, prenom',
      [classId, schoolYear]
    );
    
    console.log(`👥 Nombre total d'élèves dans la classe: ${allStudents.length}`);
    
    // Récupérer les informations de la période
    const [period] = await connection.query(
      'SELECT * FROM evaluation_periods WHERE id = ?',
      [evaluationPeriodId]
    );
    
    console.log(`📅 Période: ${period[0]?.name || 'N/A'}`);
    
    // Tableau pour stocker les résultats de tous les élèves
    const allStudentsResults = [];
    
    // Traiter chaque élève
    for (const student of allStudents) {
      console.log(`\n👤 === ÉLÈVE: ${student.nom} ${student.prenom} (ID: ${student.id}) ===`);
      
      let studentAverage = 0;
      let studentTotalWeighted = 0;
      let studentTotalCoeff = 0; // Réinitialisé pour chaque élève
      let studentGrades = [];
      
      if (isTrimester) {
        // Pour les trimestres, calculer la moyenne des 2 séquences
        console.log('📊 Calcul de la moyenne trimestrielle...');
        
        const [sequences] = await connection.query(`
          SELECT id, name FROM evaluation_periods 
          WHERE schoolYear = ? AND type = 'sequence'
          ORDER BY name
          LIMIT 2
        `, [schoolYear]);
        
        if (sequences.length >= 2) {
          // Récupérer les notes des 2 séquences
          const [seq1Grades] = await connection.query(`
            SELECT g.subjectId, g.score, g.maxScore, COALESCE(cs.coefficient, 1.0) as coefficient, s.name as subjectName
            FROM grades g
            LEFT JOIN subjects s ON g.subjectId = s.id
            LEFT JOIN class_subjects cs ON s.name = cs.subjectName AND s.schoolYear = cs.schoolYear
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [student.id, sequences[0].id, schoolYear]);
        
          const [seq2Grades] = await connection.query(`
            SELECT g.subjectId, g.score, g.maxScore, COALESCE(cs.coefficient, 1.0) as coefficient, s.name as subjectName
            FROM grades g
            LEFT JOIN subjects s ON g.subjectId = s.id
            LEFT JOIN class_subjects cs ON s.name = cs.subjectName AND s.schoolYear = cs.schoolYear
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [student.id, sequences[1].id, schoolYear]);
          
          // Organiser les notes par matière
          const gradesBySubject = new Map();
          
          seq1Grades.forEach(grade => {
            if (grade.subjectId) {
              gradesBySubject.set(grade.subjectId, {
                subjectId: grade.subjectId,
                subjectName: grade.subjectName,
                seq1Score: parseFloat(grade.score) || 0,
                seq1MaxScore: parseFloat(grade.maxScore) || 20,
                coefficient: parseFloat(grade.coefficient) || 1
              });
            }
          });
          
          seq2Grades.forEach(grade => {
            if (grade.subjectId && gradesBySubject.has(grade.subjectId)) {
              const existing = gradesBySubject.get(grade.subjectId);
              existing.seq2Score = parseFloat(grade.score) || 0;
              existing.seq2MaxScore = parseFloat(grade.maxScore) || 20;
            }
          });
          
          // Calculer les moyennes par matière
          gradesBySubject.forEach((subjectGrades, subjectId) => {
            const seq1Normalized = (subjectGrades.seq1Score / subjectGrades.seq1MaxScore) * 20;
            const seq2Normalized = (subjectGrades.seq2Score / subjectGrades.seq2MaxScore) * 20;
            const average = (seq1Normalized + seq2Normalized) / 2;
            const weighted = average * subjectGrades.coefficient;
            
            studentGrades.push({
              subjectName: subjectGrades.subjectName,
              seq1: subjectGrades.seq1Score,
              seq2: subjectGrades.seq2Score,
              average: average.toFixed(2),
              coefficient: subjectGrades.coefficient,
              weighted: weighted.toFixed(2)
            });
            
                      studentTotalWeighted += weighted;
          studentTotalCoeff += parseFloat(subjectGrades.coefficient) || 1;
          console.log(`  🔢 Coeff ajouté: ${subjectGrades.coefficient} (type: ${typeof subjectGrades.coefficient}) -> Total: ${studentTotalCoeff}`);
          });
          
          console.log(`  🔍 Avant calcul moyenne: totalCoeff=${studentTotalCoeff} (type: ${typeof studentTotalCoeff}), totalWeighted=${studentTotalWeighted}`);
          studentAverage = studentTotalCoeff > 0 ? studentTotalWeighted / studentTotalCoeff : 0;
          
          console.log(`📊 Notes des séquences:`);
          studentGrades.forEach(grade => {
            console.log(`  - ${grade.subjectName}: Seq1=${grade.seq1}, Seq2=${grade.seq2}, Moy=${grade.average}, Coef=${grade.coefficient}, Total=${grade.weighted}`);
          });
          console.log(`📊 Moyenne trimestrielle: ${studentAverage.toFixed(2)}/20`);
        }
      } else {
        // Pour les séquences, calculer la moyenne directe avec les coefficients de class_subjects
        console.log('📊 Calcul de la moyenne séquentielle...');
        
        const [grades] = await connection.query(`
          SELECT g.score, g.maxScore, COALESCE(cs.coefficient, 1.0) as coefficient, s.name as subjectName
          FROM grades g
          LEFT JOIN subjects s ON g.subjectId = s.id
          LEFT JOIN class_subjects cs ON s.name = cs.subjectName AND s.schoolYear = cs.schoolYear
          WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
        `, [student.id, evaluationPeriodId, schoolYear]);
        
        grades.forEach(grade => {
          const score = parseFloat(grade.score) || 0;
          const maxScore = parseFloat(grade.maxScore) || 20;
          const coefficient = parseFloat(grade.coefficient) || 1;
          const normalizedScore = (score / maxScore) * 20;
          const weighted = normalizedScore * coefficient;
          
          studentGrades.push({
            subjectName: grade.subjectName,
            score: score,
            maxScore: maxScore,
            normalized: normalizedScore.toFixed(2),
            coefficient: coefficient,
            weighted: weighted.toFixed(2)
          });
          
          studentTotalWeighted += weighted;
          studentTotalCoeff += parseFloat(coefficient) || 1;
          console.log(`  🔢 Coeff ajouté: ${coefficient} (type: ${typeof coefficient}) -> Total: ${studentTotalCoeff}`);
        });
        
        console.log(`  🔍 Avant calcul moyenne: totalCoeff=${studentTotalCoeff} (type: ${typeof studentTotalCoeff}), totalWeighted=${studentTotalWeighted}`);
        studentAverage = studentTotalCoeff > 0 ? studentTotalWeighted / studentTotalCoeff : 0;
        
        console.log(`📊 Notes de la séquence:`);
        studentGrades.forEach(grade => {
          console.log(`  - ${grade.subjectName}: ${grade.score}/${grade.maxScore} (${grade.normalized}/20), Coef=${grade.coefficient}, Total=${grade.weighted}`);
        });
        console.log(`📊 Moyenne séquentielle: ${studentAverage.toFixed(2)}/20`);
      }
      
      // Stocker les résultats de cet élève (SANS les rangs pré-calculés obsolètes)
      allStudentsResults.push({
        studentId: student.id,
        nom: student.nom,
        prenom: student.prenom,
        average: studentAverage,
        totalWeighted: studentTotalWeighted,
        totalCoeff: studentTotalCoeff,
        grades: studentGrades
      });
      
      console.log(`📊 Résumé: Moyenne=${studentAverage.toFixed(2)}, Total pondéré=${studentTotalWeighted.toFixed(2)}, Coeff total=${studentTotalCoeff.toFixed(2)} (type: ${typeof studentTotalCoeff})`);
    }
    
    // Trier tous les élèves par moyenne décroissante pour calculer les vrais rangs
    console.log('\n🏆 === CALCUL DES VRAIS RANGS ===');
    allStudentsResults.sort((a, b) => b.average - a.average);
    
    // Vérifier qu'il n'y a pas de rangs dupliqués
    const averages = allStudentsResults.map(s => s.average);
    const uniqueAverages = [...new Set(averages)];
    
    if (averages.length !== uniqueAverages.length) {
      console.log('⚠️ ATTENTION: Moyennes identiques détectées!');
      console.log(`   Moyennes: ${averages.map(a => a.toFixed(2)).join(', ')}`);
      
      // Gérer les ex-aequo en ajoutant un petit décalage
      allStudentsResults.forEach((student, index) => {
        if (index > 0 && student.average === allStudentsResults[index - 1].average) {
          console.log(`   ⚠️ Ex-aequo détecté: ${student.nom} et ${allStudentsResults[index - 1].nom} ont la même moyenne`);
        }
      });
    }
    
    allStudentsResults.forEach((student, index) => {
      const trueRank = index + 1;
      console.log(`${trueRank}. ${student.nom} ${student.prenom}: ${student.average.toFixed(2)}/20`);
    });
    
    console.log('\n🔍 === DIAGNOSTIC TERMINÉ ===\n');
    
    return allStudentsResults;
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic des rangs:', error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { 
      studentId, 
      evaluationPeriodId, 
      schoolYear, 
      classId, 
      frontendRank, 
      frontendTotalStudents, 
      frontendAverage,
      calculatedRanks // Nouveau: rangs pré-calculés du frontend
    } = req.body;

    if (!studentId || !evaluationPeriodId || !schoolYear || !classId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const connection = await pool.getConnection();

    // Log des données reçues du frontend
    console.log('🎯 Données reçues du frontend:');
    console.log(`   - frontendRank: ${frontendRank}`);
    console.log(`   - frontendTotalStudents: ${frontendTotalStudents}`);
    console.log(`   - frontendAverage: ${frontendAverage}`);
    console.log(`   - calculatedRanks:`, calculatedRanks);
    console.log(`   - Type de frontendTotalStudents: ${typeof frontendTotalStudents}`);
    console.log(`   - frontendTotalStudents est null/undefined: ${frontendTotalStudents === null || frontendTotalStudents === undefined}`);

    // Récupérer les données de l'élève
    const [students] = await connection.query(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    if (students.length === 0) {      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const student = students[0];

    // Récupérer les notes de l'élève
    const [grades] = await connection.query(`
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
    `, [studentId, evaluationPeriodId, schoolYear]);

    // Récupérer le nom de la classe pour les matières
    const [classInfo] = await connection.query(
      'SELECT name FROM school_classes WHERE id = ?',
      [classId]
    );

    // Récupérer les matières de la classe pour s'assurer d'avoir une entrée pour chaque matière
    const [classSubjects] = await connection.query(
      'SELECT subjectId, subjectName, coefficient, maxScore FROM class_subjects WHERE className = ? AND schoolYear = ?',
      [classInfo[0]?.name || '', schoolYear]
    );

    // Récupérer les informations de la période
    const [periods] = await connection.query(
      'SELECT * FROM evaluation_periods WHERE id = ? AND isActive = true',
      [evaluationPeriodId]
    );

    const period = periods[0];
    
    // Récupérer les appréciations sauvegardées pour cet élève
    console.log('📝 Récupération des appréciations sauvegardées...');
    const [savedComments] = await connection.query(
      'SELECT teacherComments, principalComments FROM report_cards WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?',
      [studentId, evaluationPeriodId, schoolYear]
    );
    
    let teacherComments = '';
    let principalComments = '';
    
    if (savedComments.length > 0) {
      teacherComments = savedComments[0].teacherComments || '';
      principalComments = savedComments[0].principalComments || '';
      console.log('✅ Appréciations trouvées:');
      console.log('   - Professeur:', teacherComments.substring(0, 50) + '...');
      console.log('   - Chef établissement:', principalComments.substring(0, 50) + '...');
    } else {
      console.log('⚠️ Aucune appréciation trouvée pour cet élève');
    }
    
    // Vérifier si c'est un trimestre (contient "trim" ou "trimester")
    const isTrimester = period && period.name && (period.name.toLowerCase().includes('trim') || period.name.toLowerCase().includes('trimester'));
    
    // CALCULER LES VRAIS RANGS EN TEMPS RÉEL POUR LA SÉQUENCE/TRIMESTRE DEMANDÉ
    console.log('🚀 Début de la génération du bulletin...');
    console.log(`🎯 Calcul des rangs pour la période: ${evaluationPeriodId} (${isTrimester ? 'TRIMESTRE' : 'SÉQUENCE'})`);
    
    // Calculer les rangs spécifiquement pour cette période
    let diagnosticResults = [];
    let currentStudentResult = null;
    
    if (isTrimester) {
      // Pour les trimestres, calculer les rangs basés sur les moyennes des séquences
      console.log('📊 Calcul des rangs pour TRIMESTRE...');
      diagnosticResults = await logRankDiagnostics(connection, classInfo[0]?.name || '', schoolYear, evaluationPeriodId, true);
    } else {
      // Pour les séquences, calculer les rangs basés sur les notes directes
      console.log('📊 Calcul des rangs pour SÉQUENCE...');
      diagnosticResults = await logRankDiagnostics(connection, classInfo[0]?.name || '', schoolYear, evaluationPeriodId, false);
    }
    
    // Trouver l'élève actuel dans les résultats du diagnostic
    if (diagnosticResults && diagnosticResults.length > 0) {
      currentStudentResult = diagnosticResults.find(s => s.studentId === parseInt(studentId));
      if (currentStudentResult) {
        console.log(`🎯 Élève actuel: ${currentStudentResult.nom} ${currentStudentResult.prenom}`);
        console.log(`📊 Moyenne calculée: ${currentStudentResult.average.toFixed(2)}/20`);
        console.log(`🏆 Rang calculé: ${diagnosticResults.findIndex(s => s.studentId === parseInt(studentId)) + 1}/${diagnosticResults.length}`);
      }
    }

    let sequenceGrades = [];
    let trimesterGrades = [];
    
    if (isTrimester) {
      console.log('📊 Génération d\'un bulletin de TRIMESTRE');
      
      // Récupérer les notes des séquences du trimestre (plus flexible)
      const [sequences] = await connection.query(`
        SELECT id, name FROM evaluation_periods 
        WHERE schoolYear = ? AND type = 'sequence'
        ORDER BY name
      `, [schoolYear]);
      
      console.log('📝 Séquences trouvées:', sequences);
      
      if (sequences.length > 0) {
        // Logique exactement identique à generate-all
        let sequencesToUse = [];
        
        if (period.name.includes('1er') || period.name.includes('1er Trimestre')) {
          // 1er Trimestre → Séquences 1 et 2
          sequencesToUse = sequences.slice(0, 2);
          console.log('📚 1er Trimestre: Séquences 1 et 2 sélectionnées');
        } else if (period.name.includes('2ème') || period.name.includes('2ème Trimestre')) {
          // 2ème Trimestre → Séquences 3 et 4
          sequencesToUse = sequences.slice(2, 4);
          console.log('📚 2ème Trimestre: Séquences 3 et 4 sélectionnées');
        } else if (period.name.includes('3ème') || period.name.includes('3ème Trimestre')) {
          // 3ème Trimestre → Séquences 5 et 6
          sequencesToUse = sequences.slice(4, 6);
          console.log('📚 3ème Trimestre: Séquences 5 et 6 sélectionnées');
        } else {
          // Fallback: prendre les 2 premières séquences
          sequencesToUse = sequences.slice(0, 2);
          console.log('📚 Fallback: 2 premières séquences sélectionnées');
        }
        
        console.log('📝 Séquences à utiliser:', sequencesToUse);
        console.log(`📊 Séquences sélectionnées pour ${period.name}:`);
        sequencesToUse.forEach((seq, index) => {
          console.log(`   - Séquence ${index + 1}: ${seq.name} (ID: ${seq.id})`);
        });
        
        // Récupérer les notes des séquences
        const [seq1Grades] = await connection.query(`
          SELECT 
            g.*,
            s.name as subjectName,
            s.category,
            COALESCE(cs.coefficient, 1.0) as coefficient
          FROM grades g
          LEFT JOIN subjects s ON g.subjectId = s.id
          LEFT JOIN class_subjects cs ON s.name = cs.subjectName AND s.schoolYear = cs.schoolYear
          WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
        `, [studentId, sequencesToUse[0].id, schoolYear]);
        
        let seq2Grades = [];
        if (sequencesToUse.length > 1) {
          const [seq2GradesResult] = await connection.query(`
            SELECT 
              g.*,
              s.name as subjectName,
              s.category,
              COALESCE(cs.coefficient, 1.0) as coefficient
            FROM grades g
            LEFT JOIN subjects s ON g.subjectId = s.id
            LEFT JOIN class_subjects cs ON s.name = cs.subjectName AND s.schoolYear = cs.schoolYear
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [studentId, sequencesToUse[1].id, schoolYear]);
          seq2Grades = seq2GradesResult;
        }
        
        // Organiser les notes par matière pour calculer les moyennes
        const gradesBySubject = new Map();
        
        // Ajouter les notes de la 1ère séquence
        seq1Grades.forEach(grade => {
          if (grade.subjectId) {
            gradesBySubject.set(grade.subjectId, {
              subjectId: grade.subjectId,
              subjectName: grade.subjectName,
              category: grade.category,
              coefficient: grade.coefficient,
              seq1Score: parseFloat(grade.score) || 0,
              seq1MaxScore: parseFloat(grade.maxScore) || 20,
              seq2Score: 0,
              seq2MaxScore: 20
            });
          }
        });
        
        // Ajouter ou mettre à jour avec les notes de la 2ème séquence
        seq2Grades.forEach(grade => {
          if (grade.subjectId) {
            if (gradesBySubject.has(grade.subjectId)) {
              const existing = gradesBySubject.get(grade.subjectId);
              existing.seq2Score = parseFloat(grade.score) || 0;
              existing.seq2MaxScore = parseFloat(grade.maxScore) || 20;
            } else {
              gradesBySubject.set(grade.subjectId, {
                subjectId: grade.subjectId,
                subjectName: grade.subjectName,
                category: grade.category,
                coefficient: grade.coefficient,
                seq1Score: 0,
                seq1MaxScore: 20,
                seq2Score: parseFloat(grade.score) || 0,
                seq2MaxScore: parseFloat(grade.maxScore) || 20
              });
            }
          }
        });
        
        // Calculer les moyennes par matière
        trimesterGrades = Array.from(gradesBySubject.values()).map(subject => {
          const seq1Normalized = (subject.seq1Score / subject.seq1MaxScore) * 20;
          let average;
          
          if (sequencesToUse.length > 1) {
            // 2 séquences : moyenne des 2
            const seq2Normalized = (subject.seq2Score / subject.seq2MaxScore) * 20;
            average = (seq1Normalized + seq2Normalized) / 2;
          } else {
            // 1 seule séquence : utiliser directement
            average = seq1Normalized;
          }
          
          return {
            ...subject,
            average,
            totalWeighted: average * subject.coefficient
          };
        });
        
        console.log('📊 Notes du trimestre calculées:', trimesterGrades);
      }
    } else {
      console.log('📊 Génération d\'un bulletin de SÉQUENCE');
      sequenceGrades = grades;
    }

    // UTILISER LES VRAIS RANGS CALCULÉS EN TEMPS RÉEL AU LIEU DES RANGS OBSOLÈTES
    console.log('🏆 Utilisation des VRAIS rangs calculés en temps réel...');
    
    // Récupérer tous les élèves de la classe pour l'affichage
    const [allStudents] = await connection.query(
      'SELECT id FROM students WHERE classe = (SELECT name FROM school_classes WHERE id = ?) AND anneeScolaire = ?',
      [classId, schoolYear]
    );
    
    // Utiliser les vrais rangs calculés par le diagnostic
    let rank = 1;
    let totalStudents = allStudents.length;
    
    if (diagnosticResults && diagnosticResults.length > 0) {
      // Trouver l'élève actuel dans les résultats du diagnostic
      const currentStudentIndex = diagnosticResults.findIndex(s => s.studentId === parseInt(studentId));
      if (currentStudentIndex !== -1) {
        rank = currentStudentIndex + 1;
        console.log(`✅ VRAI rang calculé en temps réel: ${rank}/${totalStudents}`);
      } else {
        console.log('⚠️ Élève non trouvé dans les résultats du diagnostic, utilisation du rang 1');
        rank = 1;
      }
    } else {
      console.log('⚠️ Aucun résultat de diagnostic, utilisation du rang 1');
      rank = 1;
    }

    // Déterminer la mention
    // Fonction pour déterminer la mention (sera définie après le calcul de la moyenne)
    const getMention = (avg) => {
      if (avg >= 18) return 'Excellent';
      if (avg >= 16) return 'Très Bien';
      if (avg >= 14) return 'Bien';
      if (avg >= 12) return 'Assez Bien';
      if (avg >= 10) return 'Passable';
      return 'Insuffisant';
    };

    // Récupérer les informations de l'école (logo, photo, etc.)
    const [schoolInfo] = await connection.query(`
      SELECT * FROM school_info LIMIT 1
    `);
    console.log('🏫 Informations de l\'école:', schoolInfo);

    // Utiliser les informations de l'élève déjà récupérées
    console.log('👤 Informations de l\'élève:', student);
    console.log('🏫 Classe de l\'élève:', student.classe);

    // Récupérer la photo de l'élève
    const [studentPhoto] = await connection.query(`
      SELECT photoUrl FROM students WHERE id = ?
    `, [studentId]);
    console.log('📸 Photo de l\'élève:', studentPhoto);

    // Récupérer le bulletin existant
    const [bulletins] = await connection.query(`
      SELECT * FROM report_cards 
      WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
      ORDER BY createdAt DESC LIMIT 1
    `, [studentId, evaluationPeriodId, schoolYear]);

    const bulletin = bulletins[0] || {};

    // Récupérer toutes les matières de la classe (même celles sans notes)
    console.log('🔍 Récupération des matières pour classId:', classId, 'schoolYear:', schoolYear);
    console.log('📝 Notes de l\'élève:', grades);
    
    // NOUVELLE LOGIQUE : Récupérer les matières selon le type de bulletin
    let allSubjects = [];
    let gradesToUse = [];
    
      if (isTrimester) {
        // Pour les trimestres, récupérer TOUTES les matières de la classe et les notes des séquences
        console.log('📚 Récupération des matières de la classe pour le trimestre');
        
        // Récupérer TOUTES les matières de la classe depuis class_subjects
        const [classSubjects] = await connection.query(`
          SELECT 
            s.id,
            s.name,
            s.category,
            cs.coefficient,
            s.maxScore
          FROM class_subjects cs
          JOIN subjects s ON cs.subjectId = s.id
          WHERE cs.className = (SELECT name FROM school_classes WHERE id = ?)
          AND cs.schoolYear = ?
        `, [classId, schoolYear]);
        
        console.log('📚 Matières de la classe trouvées:', classSubjects);
        
        if (classSubjects.length === 0) {
          // Fallback : récupérer toutes les matières si class_subjects est vide
          const [allSubjectsResult] = await connection.query(`
            SELECT id, name, category, coefficient, maxScore
            FROM subjects
            WHERE schoolYear = ?
          `, [schoolYear]);
          console.log('📚 Fallback - Toutes les matières:', allSubjectsResult);
          allSubjects = allSubjectsResult;
        } else {
          allSubjects = classSubjects;
        }
        
        // Maintenant récupérer les notes des 2 séquences pour ces matières
        const [sequences] = await connection.query(`
          SELECT id, name FROM evaluation_periods 
          WHERE schoolYear = ? AND type = 'sequence'
          ORDER BY name
          LIMIT 2
        `, [schoolYear]);
        
        console.log('📝 Séquences trouvées pour le trimestre:', sequences);
        console.log('📚 Matières de la classe (allSubjects):', allSubjects.map(s => ({ id: s.id, name: s.name })));
        
        if (sequences.length > 0 && allSubjects.length > 0) {
          // Récupérer les notes de la 1ère séquence
          const [seq1Grades] = await connection.query(`
            SELECT 
              g.subjectId,
              g.score,
              g.maxScore
            FROM grades g
            WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
          `, [studentId, sequences[0].id, schoolYear]);
          
          console.log('📊 Notes 1ère séquence:', seq1Grades);
          
          // Récupérer les notes de la 2ème séquence (si disponible)
          let seq2Grades = [];
          if (sequences.length > 1) {
            const [seq2GradesResult] = await connection.query(`
              SELECT 
                g.subjectId,
                g.score,
                g.maxScore
              FROM grades g
              WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
            `, [studentId, sequences[1].id, schoolYear]);
            seq2Grades = seq2GradesResult;
            console.log('📊 Notes 2ème séquence:', seq2Grades);
          }
          
          // Créer les notes trimestrielles avec toutes les matières de la classe
          gradesToUse = allSubjects.map(subject => {
            // Chercher les notes de cette matière dans les séquences
            const seq1Grade = seq1Grades.find(g => parseInt(g.subjectId) === subject.id);
            const seq2Grade = seq2Grades.find(g => parseInt(g.subjectId) === subject.id);
            
            console.log(`🔍 Matière ${subject.name} (${subject.id}):`);
            console.log(`  - Seq1 Grade trouvée:`, seq1Grade);
            console.log(`  - Seq2 Grade trouvée:`, seq2Grade);
            
            const seq1Score = seq1Grade ? parseFloat(seq1Grade.score) || 0 : 0;
            const seq2Score = seq2Grade ? parseFloat(seq2Grade.score) || 0 : 0;
            
            console.log(`  - Seq1 Score: ${seq1Score}, Seq2 Score: ${seq2Score}`);
            
            // Calculer la moyenne
            let average;
            if (sequences.length > 1) {
              // 2 séquences : moyenne des 2
              average = (seq1Score + seq2Score) / 2;
            } else {
              // 1 seule séquence : utiliser directement
              average = seq1Score;
            }
            
            console.log(`  - Moyenne calculée: ${average}`);
            
            return {
              id: subject.id,
              name: subject.name,
              category: subject.category || 'Autre',
              coefficient: parseFloat(subject.coefficient) || 1,
              maxScore: parseFloat(subject.maxScore) || 20,
              seq1Score: seq1Score,
              seq2Score: seq2Score,
              average: average,
              totalWeighted: average * (parseFloat(subject.coefficient) || 1)
            };
          });
          
          console.log('📊 Notes trimestrielles créées:', gradesToUse);
        }
      } else if (sequenceGrades && sequenceGrades.length > 0) {
        // Pour les séquences, utiliser les notes directes
      gradesToUse = sequenceGrades;
      const subjectsMap = new Map();
      sequenceGrades.forEach(grade => {
        if (grade.subjectId && grade.subjectName) {
          subjectsMap.set(grade.subjectId, {
            id: grade.subjectId,
            name: grade.subjectName,
            category: grade.category || 'Autre',
            coefficient: parseFloat(grade.coefficient) || 1,
            maxScore: parseFloat(grade.maxScore) || 20
          });
        }
      });
      allSubjects = Array.from(subjectsMap.values());
      console.log('📚 Matières de la séquence:', allSubjects);
    }
    
    console.log('📚 Matières trouvées via les notes:', allSubjects);

    console.log('📊 Nombre final de matières:', allSubjects ? allSubjects.length : 0);

    // Ne pas fermer la connexion ici - on en a encore besoin pour calculer les rangs par matière
    console.log('📊 Connexion maintenue pour calcul des rangs par matière');

    // Ajouter des placeholders pour les matières sans note (score = 0)
    try {
      if (allSubjects && allSubjects.length > 0) {
        const existingIds = new Set((grades || []).map(g => String(g.subjectId)));
        allSubjects.forEach(subj => {
          const subjId = subj.id || subj.subjectId;
          if (!existingIds.has(String(subjId))) {
            // Ajouter une note factice non destructive pour le calcul
            grades.push({
              subjectId: subjId,
              subjectName: subj.name || subj.subjectName || '',
              score: 0,
              maxScore: parseFloat(subj.maxScore) || 20,
              coefficient: parseFloat(subj.coefficient) || 1,
              weightedScore: 0
            });
          }
        });
      }
    } catch (placeholderErr) {
      console.log('⚠️ Erreur lors de l\'injection des placeholders de matières:', placeholderErr);
    }

    // Créer un map des notes par matière
    const gradesMap = new Map();
    grades.forEach(grade => {
      gradesMap.set(grade.subjectId, grade);
    });

    // Calculer les totaux
    const totalWeightedScore = grades.reduce((sum, grade) => {
      return sum + (parseFloat(grade.weightedScore) || 0);
    }, 0);

    const totalCoefficient = grades.reduce((sum, grade) => {
      return sum + (parseFloat(grade.coefficient) || 0);
    }, 0);

    const average = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;

    // Calculer la moyenne générale de la classe (même logique que generate-trimestre-individuel.js)
    let classGeneralAverage = 0;
    if (allStudents && allStudents.length > 0) {
      const studentAverages = await Promise.all(
        allStudents.map(async (s) => {
          let totalWeighted = 0;
          let totalCoeff = 0;
          
          if (isTrimester) {
            // Pour les trimestres, calculer sur les moyennes des 2 séquences
            const [sequences] = await connection.query(`
              SELECT id FROM evaluation_periods 
              WHERE schoolYear = ? AND type = 'sequence'
              ORDER BY name
              LIMIT 2
            `, [schoolYear]);
            
            if (sequences.length > 0) {
              // Récupérer les notes de la 1ère séquence
              const [seq1Grades] = await connection.query(`
                SELECT 
                  g.score,
                  g.subjectId,
                  s.coefficient
                FROM grades g
                LEFT JOIN subjects s ON g.subjectId = s.id
                WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
              `, [s.id, sequences[0].id, schoolYear]);
              
              // Récupérer les notes de la 2ème séquence (si disponible)
              let seq2Grades = [];
              if (sequences.length > 1) {
                const [seq2GradesResult] = await connection.query(`
                  SELECT 
                    g.score,
                    g.subjectId,
                    s.coefficient
                  FROM grades g
                  LEFT JOIN subjects s ON g.subjectId = s.id
                  WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
                `, [s.id, sequences[1].id, schoolYear]);
                seq2Grades = seq2GradesResult;
              }
              
              // Combiner les notes des deux séquences pour calculer les moyennes
              const gradesBySubject = new Map();
              
              // Ajouter les notes de la 1ère séquence
              seq1Grades.forEach(grade => {
                gradesBySubject.set(grade.subjectId, {
                  seq1Score: parseFloat(grade.score) || 0,
                  coef: parseFloat(grade.coefficient) || 1
                });
              });
              
              // Ajouter ou mettre à jour avec les notes de la 2ème séquence
              seq2Grades.forEach(grade => {
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
              
              // Calculer les moyennes pondérées pour chaque matière
              gradesBySubject.forEach((grades, subjectId) => {
                const seq1Score = grades.seq1Score || 0;
                const seq2Score = grades.seq2Score || 0;
                const average = (seq1Score + seq2Score) / 2; // Moyenne des 2 séquences
                const coef = grades.coef;
                
                totalWeighted += average * coef;
                totalCoeff += coef;
              });
            }
          } else {
            // Pour les séquences, calculer directement
            const [studentGrades] = await connection.query(`
              SELECT 
                g.score,
                g.subjectId,
                s.coefficient
              FROM grades g
              LEFT JOIN subjects s ON g.subjectId = s.id
              WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
            `, [s.id, evaluationPeriodId, schoolYear]);
            
            studentGrades.forEach(grade => {
              const score = parseFloat(grade.score) || 0;
              const coef = parseFloat(grade.coefficient) || 1;
              totalWeighted += score * coef;
              totalCoeff += coef;
            });
          }
          
          return {
            studentId: s.id,
            average: totalCoeff > 0 ? totalWeighted / totalCoeff : 0
          };
        })
      );
      
      classGeneralAverage = studentAverages.length > 0 
        ? studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length 
        : 0;
    }

    // Déterminer la mention maintenant que average est défini
    const mention = getMention(average);
    
    // Fonction pour déterminer la mention par matière
    const getSubjectMention = (score, maxScore) => {
      const normalizedScore = (score / maxScore) * 20;
      if (normalizedScore >= 18) return 'Excellent';
      if (normalizedScore >= 16) return 'Très Bien';
      if (normalizedScore >= 14) return 'Bien';
      if (normalizedScore >= 12) return 'Assez Bien';
      if (normalizedScore >= 10) return 'Passable';
      return 'Insuffisant';
    };

    // Fonction pour dessiner l'emblème officiel
    const drawOfficialEmblem = (doc, x, y, size) => {
      const centerX = x + size/2;
      const centerY = y + size/2;
      const radius = size/2;
      
      // Cercle extérieur avec bordure
      doc.circle(centerX, centerY, radius)
         .fill('#f8fafc')
         .stroke('#1e40af', 2);
      
      // Cercle intérieur
      doc.circle(centerX, centerY, radius - 8)
         .fill('#1e40af')
         .stroke('#1e3a8a', 1);
      
      // Étoile centrale (symbole de la République)
      const starSize = 12;
      doc.fillColor('#fbbf24');
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x1 = centerX + Math.cos(angle) * starSize;
        const y1 = centerY + Math.sin(angle) * starSize;
        doc.circle(x1, y1, 2).fill();
      }
      
      // Texte autour du cercle
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#1e40af');
      doc.text('RÉPUBLIQUE', centerX - 25, centerY - radius + 8);
      doc.text('DU CAMEROUN', centerX - 25, centerY - radius + 15);
      
      // Points cardinaux
      doc.fontSize(5).fillColor('#374151');
      doc.text('N', centerX, y + 5);
      doc.text('S', centerX, y + size - 5);
      doc.text('E', x + size - 5, centerY);
      doc.text('O', x + 5, centerY);
    };

    // Générer le PDF (plus compact)
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    });

    // Configuration de la réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulletin_${studentId}_${evaluationPeriodId}.pdf`);

    // Pipe le PDF vers la réponse
    doc.pipe(res);

    // ===== EN-TÊTE OFFICIEL CAMEROUNAIS =====
    // Déterminer le type d'établissement et le ministère correspondant
    let ministryFrench, ministryEnglish, schoolTypeFrench, schoolTypeEnglish;
    
    if (student.classe && student.classe.toLowerCase().includes('primaire')) {
      ministryFrench = 'MINISTÈRE DE L\'ÉDUCATION DE BASE';
      ministryEnglish = 'MINISTRY OF BASIC EDUCATION';
      schoolTypeFrench = 'ÉCOLE PRIMAIRE';
      schoolTypeEnglish = 'PRIMARY SCHOOL';
    } else if (student.classe && student.classe.toLowerCase().includes('technique')) {
      ministryFrench = 'MINISTÈRE DE L\'ENSEIGNEMENT TECHNIQUE';
      ministryEnglish = 'MINISTRY OF TECHNICAL EDUCATION';
      schoolTypeFrench = 'ÉCOLE TECHNIQUE';
      schoolTypeEnglish = 'TECHNICAL SCHOOL';
    } else {
      // Par défaut : enseignement secondaire
      ministryFrench = 'MINISTÈRE DE L\'ENSEIGNEMENT SECONDAIRE';
      ministryEnglish = 'MINISTRY OF SECONDARY EDUCATION';
      schoolTypeFrench = 'ÉCOLE SECONDAIRE';
      schoolTypeEnglish = 'SECONDARY SCHOOL';
    }

    // Section gauche (français) - exactement comme l'image mais dynamique
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af')
       .text('RÉPUBLIQUE DU CAMEROUN', 10, 10);
    
    doc.fontSize(7).fillColor('#374151')
       .text('Paix - Travail - Patrie', 10, 20);
    
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af')
       .text(ministryFrench, 10, 30);
    
    doc.fontSize(7).fillColor('#374151')
       .text(schoolTypeFrench, 10, 40);
    
    doc.fontSize(7).fillColor('#374151')
       .text(`BP: ${schoolInfo && schoolInfo[0] && schoolInfo[0].address ? schoolInfo[0].address.split(',')[0] : 'Yaoundé'}`, 10, 50);
    
    doc.fontSize(7).fillColor('#374151')
       .text(`e-mail: ${schoolInfo && schoolInfo[0] && schoolInfo[0].email ? schoolInfo[0].email : 'contact@ecole.cm'}`, 10, 60);

    // Section droite (anglais) - exactement comme l'image mais dynamique
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af')
       .text('REPUBLIC OF CAMEROON', 400, 10);
    
    doc.fontSize(7).fillColor('#374151')
       .text('Peace - Work - Fatherland', 400, 20);
    
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af')
       .text(ministryEnglish, 400, 30);
    
    doc.fontSize(7).fillColor('#374151')
       .text(schoolTypeEnglish, 400, 40);
    
    doc.fontSize(7).fillColor('#374151')
       .text(`P.O BOX ${schoolInfo && schoolInfo[0] && schoolInfo[0].address ? schoolInfo[0].address.split(',')[0] : 'Yaoundé'}`, 400, 50);
    
    doc.fontSize(7).fillColor('#374151')
       .text(`e-mail: ${schoolInfo && schoolInfo[0] && schoolInfo[0].email ? schoolInfo[0].email : 'contact@ecole.cm'}`, 400, 60);

    // Logo de l'école au centre (emblème officiel)
    const logoX = 250; // Centré entre les deux sections de texte
    const logoY = 15;
    const logoSize = 40; // Taille optimale pour être visible
    
    if (schoolInfo && schoolInfo[0] && schoolInfo[0].logoUrl) {
      try {
        // Si c'est une URL externe ou data URI
        if (schoolInfo[0].logoUrl.startsWith('data:image/') || schoolInfo[0].logoUrl.startsWith('http')) {
          doc.image(schoolInfo[0].logoUrl, logoX, logoY, { width: logoSize, height: logoSize });
        } else {
          // Si c'est un chemin local
          doc.image(schoolInfo[0].logoUrl, logoX, logoY, { width: logoSize, height: logoSize });
        }
      } catch (error) {
        console.log('Erreur lors du chargement du logo, utilisation de l\'emblème par défaut');
        // Emblème par défaut si erreur
        drawOfficialEmblem(doc, logoX, logoY, logoSize);
      }
    } else {
      // Emblème par défaut si pas d'image
      drawOfficialEmblem(doc, logoX, logoY, logoSize);
    }

    // Titre principal du bulletin (bien espacé de l'en-tête)
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
       .text('RELEVÉ DE NOTES', 40, 80, { align: 'center', width: 515 })
       .fontSize(9).fillColor('#374151')
       .text('STUDENT REPORT CARD', 40, 95, { align: 'center', width: 515 });

    // Période et année scolaire
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
       .text(`Période: ${period?.name || 'Non définie'}`, 15, 110)
       .text(`Année scolaire: ${schoolYear}`, 300, 110);

    // Ligne de séparation
    doc.moveTo(15, 125).lineTo(580, 125).stroke('#e5e7eb', 2);

    // ===== INFORMATIONS DE LA CLASSE =====
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af')
       .text('INFORMATIONS DE LA CLASSE / CLASS INFORMATION', 15, 140);

    doc.fontSize(8).font('Helvetica').fillColor('#374151');
    doc.text(`Classe / Class: ${student.classe || 'N/A'}`, 15, 150);
    doc.text(`Niveau / Level: ${student.niveau || 'N/A'}`, 200, 150);
    doc.text(`Effectif total / Total students: ${allStudents.length}`, 380, 150);

    // Ligne de séparation
    doc.moveTo(15, 158).lineTo(580, 158).stroke('#e5e7eb', 1);

    // ===== INFORMATIONS DE L'ÉLÈVE =====

    // Photo de l'élève (depuis la base de données)
    const photoX = 15;
    const photoY = 163; // Espacement raisonnable avec le séparateur
    const photoSize = 60;
    
    if (studentPhoto && studentPhoto[0] && studentPhoto[0].photoUrl) {
      try {
        // Si c'est une data URI ou URL
        if (studentPhoto[0].photoUrl.startsWith('data:image/') || studentPhoto[0].photoUrl.startsWith('http')) {
          doc.image(studentPhoto[0].photoUrl, photoX, photoY, { width: photoSize, height: photoSize });
        } else {
          // Si c'est un chemin local
          doc.image(studentPhoto[0].photoUrl, photoX, photoY, { width: photoSize, height: photoSize });
        }
      } catch (error) {
        console.log('Erreur lors du chargement de la photo, utilisation du placeholder');
        // Placeholder si erreur
        doc.rect(photoX, photoY, photoSize, photoSize).stroke('#1e40af', 2);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
           .text('PHOTO', photoX + photoSize/2 - 20, photoY + photoSize/2);
      }
    } else {
      // Placeholder si pas de photo
      doc.rect(photoX, photoY, photoSize, photoSize).stroke('#1e40af', 2);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
         .text('PHOTO', photoX + photoSize/2 - 20, photoY + photoSize/2);
    }

    // Informations de l'élève à côté de la photo
    doc.fontSize(9).font('Helvetica').fillColor('#374151');
    doc.text(`Matricule / ID: ${student.id}`, photoX + photoSize + 15, photoY + 5);
    doc.text(`Nom / Last Name: ${student.nom || 'N/A'}`, photoX + photoSize + 15, photoY + 20);
    doc.text(`Prénom / First Name: ${student.prenom || 'N/A'}`, photoX + photoSize + 15, photoY + 35);
    doc.text(`Classe / Class: ${student.classe || 'N/A'}`, photoX + photoSize + 15, photoY + 50);

    // Code QR à l'extrémité droite, même ligne et taille que la photo
    const qrSize = photoSize; // Même taille que la photo
    const qrX = 580 - qrSize; // Position à l'extrémité droite (580 - 60 = 520)
    const qrY = photoY; // Même ligne que la photo
    
    // Données complètes pour le code QR (toutes les informations du bulletin)
    const qrData = {
      // Informations de l'établissement
      school: {
        name: schoolInfo && schoolInfo[0] ? schoolInfo[0].name : 'École Secondaire',
        address: schoolInfo && schoolInfo[0] ? schoolInfo[0].address : 'Yaoundé',
        email: schoolInfo && schoolInfo[0] ? schoolInfo[0].email : 'contact@ecole.cm'
      },
      // Informations de l'élève
      student: {
        id: student.id,
        name: `${student.nom} ${student.prenom}`,
        class: student.classe,
        level: student.niveau
      },
      // Informations de la période
      period: {
        name: period?.name || 'Non définie',
        schoolYear: schoolYear,
        type: isTrimester ? 'Trimestre' : 'Séquence'
      },
      // Résultats généraux
      results: {
        totalScore: totalWeightedScore.toFixed(2),
        totalCoefficient: totalCoefficient.toFixed(2),
        average: average.toFixed(2),
        rank: formatRank(rank),
        mention: mention,
        classAverage: classGeneralAverage.toFixed(2)
      },
      // Notes détaillées par matière
      grades: grades.map(grade => {
        if (isTrimester) {
          const seq1Score = grade.seq1Score || 0;
          const seq2Score = grade.seq2Score || 0;
          const moyScore = (seq1Score + seq2Score) / 2;
          return {
            subject: grade.subjectName,
            category: grade.category,
            seq1Score: seq1Score,
            seq2Score: seq2Score,
            average: moyScore,
            coefficient: grade.coefficient,
            total: moyScore * (grade.coefficient || 1),
            rank: 1, // Rang par défaut pour les trimestres
            mention: moyScore >= 18 ? 'Excellent' : moyScore >= 16 ? 'Très Bien' : moyScore >= 14 ? 'Bien' : moyScore >= 12 ? 'Assez Bien' : moyScore >= 10 ? 'Passable' : 'Insuffisant'
          };
        } else {
          return {
            subject: grade.subjectName,
            category: grade.category,
            score: grade.score,
            maxScore: grade.maxScore,
            coefficient: grade.coefficient,
            total: grade.score * (grade.coefficient || 1),
            rank: 1, // Rang par défaut pour les séquences
            mention: grade.score >= 18 ? 'Excellent' : grade.score >= 16 ? 'Très Bien' : grade.score >= 14 ? 'Bien' : grade.score >= 12 ? 'Assez Bien' : grade.score >= 10 ? 'Passable' : 'Insuffisant'
          };
        }
      }),
      // Appréciations
      comments: {
        teacher: teacherComments,
        principal: principalComments
      },
      // Métadonnées
      generatedAt: new Date().toISOString(),
      totalStudents: allStudents.length
    };
    
    try {
      // Convertir en JSON pour le code QR
      const qrJsonString = JSON.stringify(qrData, null, 2);
      
      // Générer le code QR avec la bibliothèque qrcode
      const QRCode = require('qrcode');
      
      // Créer un buffer pour le code QR
      const qrBuffer = await QRCode.toBuffer(qrJsonString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: qrSize,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });
      
      // Ajouter le code QR au PDF
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
      
      // Bordure autour du code QR
      doc.rect(qrX, qrY, qrSize, qrSize).stroke('#1e40af', 1);
      
      console.log(`📱 Code QR généré pour ${student.nom} à la position (${qrX}, ${qrY})`);
      console.log(`📊 Données du code QR: ${qrJsonString.length} caractères`);
      
    } catch (error) {
      console.log(`⚠️ Erreur lors de la génération du code QR pour ${student.nom}:`, error);
      
      // Fallback : code QR simple avec les données essentielles
      try {
        const QRCode = require('qrcode');
        const simpleData = JSON.stringify({
          student: `${student.nom} ${student.prenom}`,
          class: student.classe,
          period: period?.name,
          average: average.toFixed(2),
          rank: formatRank(rank),
          mention: mention
        });
        
        const qrBuffer = await QRCode.toBuffer(simpleData, {
          errorCorrectionLevel: 'L',
          type: 'image/png',
          width: qrSize
        });
        
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        doc.rect(qrX, qrY, qrSize, qrSize).stroke('#1e40af', 1);
        
        console.log(`📱 Code QR de fallback généré pour ${student.nom}`);
        
      } catch (fallbackError) {
        console.log(`❌ Échec du fallback QR pour ${student.nom}:`, fallbackError);
        // Dernier recours : rectangle avec texte
        doc.rect(qrX, qrY, qrSize, qrSize).stroke('#9ca3af', 1);
        doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
           .text('QR ERROR', qrX + qrSize/2 - 25, qrY + qrSize/2);
      }
    }

    // Ligne de séparation
    doc.moveTo(15, photoY + photoSize + 10).lineTo(580, photoY + photoSize + 10).stroke('#e5e7eb', 1);

    // ===== TABLEAU DES NOTES =====
    const titleText = isTrimester ? 'NOTES DU TRIMESTRE / TRIMESTER GRADES' : 'NOTES PAR MATIÈRE / SUBJECT GRADES';
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af') // Taille réduite pour le titre
       .text(titleText, 15, photoY + photoSize + 20);

    // En-têtes du tableau des notes (très compact)
    const gradesTableTop = photoY + photoSize + 32;
    
    // En-têtes avec fond gris (hauteur réduite)
    doc.rect(15, gradesTableTop, 565, 14).fill('#f3f4f6');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000'); // Taille réduite pour les en-têtes
    
    if (isTrimester) {
      // En-têtes pour trimestre (2 séquences + moyenne)
      doc.text('Matière', 20, gradesTableTop + 4);
      doc.text('Seq1', 120, gradesTableTop + 4);
      doc.text('Seq2', 150, gradesTableTop + 4);
      doc.text('Moy.', 180, gradesTableTop + 4);
      doc.text('Coef.', 210, gradesTableTop + 4);
      doc.text('Total', 240, gradesTableTop + 4);
      doc.text('Rang', 290, gradesTableTop + 4);
      doc.text('Mention', 340, gradesTableTop + 4);
    } else {
      // En-têtes pour séquence (note unique)
      doc.text('Matière', 20, gradesTableTop + 4);
      doc.text('Note', 140, gradesTableTop + 4);
      doc.text('Max', 170, gradesTableTop + 4);
      doc.text('Coef.', 200, gradesTableTop + 4);
      doc.text('Total', 230, gradesTableTop + 4);
      doc.text('Rang', 280, gradesTableTop + 4);
      doc.text('Mention', 320, gradesTableTop + 4);
    }

    // Contenu du tableau des notes (plus compact)
    let currentY = gradesTableTop + 23;
    doc.fontSize(7).font('Helvetica').fillColor('#000000'); // Couleur noire pour une meilleure visibilité

    // Debug: afficher le nombre de matières
    console.log('Nombre de matières trouvées:', allSubjects.length);
    console.log('Matières:', allSubjects);
    console.log('Notes trouvées:', grades.length);
    console.log('Map des notes:', gradesMap);

    // Vérifier que allSubjects est bien un tableau
    if (Array.isArray(allSubjects) && allSubjects.length > 0) {
      // UTILISER LES RANGS CALCULÉS PAR LE FRONTEND AU LIEU DE RECALCULER
      const subjectRanks = new Map();
      
      if (calculatedRanks && calculatedRanks[studentId]) {
        // Le frontend a envoyé les rangs calculés, les utiliser directement
        console.log('🎯 Utilisation des rangs calculés par le frontend pour les matières');
        
        // Récupérer les rangs par matière depuis calculatedRanks
        const studentRanksData = calculatedRanks[studentId];
        
        // Pour chaque matière, récupérer le rang depuis les données du frontend
        for (const subject of allSubjects) {
          // Chercher le rang de cette matière dans les données du frontend
          // Nous devons adapter la structure selon comment les rangs par matière sont stockés
          let subjectRank = 1; // Par défaut
          
          // Si nous avons des rangs par matière dans le frontend, les utiliser
          if (studentRanksData.subjectRanks && studentRanksData.subjectRanks[subject.id]) {
            subjectRank = studentRanksData.subjectRanks[subject.id];
          } else if (studentRanksData.ranksBySubject && studentRanksData.ranksBySubject[subject.id]) {
            subjectRank = studentRanksData.ranksBySubject[subject.id].rank;
          }
          
          subjectRanks.set(subject.id, subjectRank);
          console.log(`🏆 Rang de ${student.nom} en ${subject.name} (frontend): ${subjectRank}`);
        }
      } else {
        // Fallback : calculer les rangs si le frontend n'a pas envoyé de données
        console.log('⚠️ Aucun rang calculé reçu du frontend, calcul des rangs par matière en cours...');
        
        for (const subject of allSubjects) {
          // Logique de calcul des rangs par matière (gardée comme fallback)
          let subjectGrades = [];
          
          if (isTrimester) {
            // Pour les trimestres, récupérer les notes des séquences correspondantes
            const [sequences] = await connection.query(`
              SELECT id FROM evaluation_periods 
              WHERE schoolYear = ? AND type = 'sequence'
              ORDER BY name
              LIMIT 2
            `, [schoolYear]);
            
            if (sequences.length > 0) {
              // Récupérer les notes de la 1ère séquence
              const [seq1Grades] = await pool.execute(`
                SELECT 
                  g.studentId,
                  g.score,
                  g.maxScore,
                  g.coefficient
                FROM grades g
                WHERE g.subjectId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
                AND g.score IS NOT NULL AND g.score != ''
              `, [subject.id, sequences[0].id, schoolYear]);
              
              // Récupérer les notes de la 2ème séquence (si disponible)
              let seq2Grades = [];
              if (sequences.length > 1) {
                const [seq2GradesResult] = await pool.execute(`
                  SELECT 
                    g.studentId,
                    g.score,
                    g.maxScore,
                    g.coefficient
                  FROM grades g
                  WHERE g.subjectId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
                  AND g.score IS NOT NULL AND g.score != ''
                `, [subject.id, sequences[1].id, schoolYear]);
                seq2Grades = seq2GradesResult;
              }
              
              // Combiner les notes des deux séquences pour calculer les moyennes
              const gradesByStudent = new Map();
              
              // Ajouter les notes de la 1ère séquence
              seq1Grades.forEach(grade => {
                gradesByStudent.set(grade.studentId, {
                  seq1Score: parseFloat(grade.score) || 0,
                  seq1MaxScore: parseFloat(grade.maxScore) || 20
                });
              });
              
              // Ajouter ou mettre à jour avec les notes de la 2ème séquence
              seq2Grades.forEach(grade => {
                if (gradesByStudent.has(grade.studentId)) {
                  const existing = gradesByStudent.get(grade.studentId);
                  existing.seq2Score = parseFloat(grade.score) || 0;
                  existing.seq2MaxScore = parseFloat(grade.maxScore) || 20;
                } else {
                  gradesByStudent.set(grade.studentId, {
                    seq1Score: 0,
                    seq1MaxScore: 20,
                    seq2Score: parseFloat(grade.score) || 0,
                    seq2MaxScore: parseFloat(grade.maxScore) || 20
                  });
                }
              });
              
              // Convertir en tableau pour le tri
              subjectGrades = Array.from(gradesByStudent.entries()).map(([studentId, grades]) => ({
                studentId,
                score: grades.seq1Score + grades.seq2Score, // Score total pour le tri
                maxScore: grades.seq1MaxScore + grades.seq2MaxScore, // Max total pour le tri
                average: (grades.seq1Score + grades.seq2Score) / 2 // Moyenne pour l'affichage
              }));
            }
          } else {
            // Pour les séquences, récupérer les notes directes
            const [gradesResult] = await pool.execute(`
              SELECT 
                g.studentId,
                g.score,
                g.maxScore,
                g.coefficient
              FROM grades g
              WHERE g.subjectId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
              AND g.score IS NOT NULL AND g.score != ''
            `, [subject.id, evaluationPeriodId, schoolYear]);
            
            subjectGrades = gradesResult;
          }
          
          // Calculer le rang de l'élève actuel dans cette matière
          if (subjectGrades.length > 0) {
            // Calculer les moyennes pondérées pour chaque élève dans cette matière
            const studentsWithAverages = subjectGrades.map(grade => {
              let average;
              if (isTrimester) {
                // Pour les trimestres, utiliser la moyenne des 2 séquences
                average = grade.average || 0;
              } else {
                // Pour les séquences, normaliser la note sur 20
                const score = parseFloat(grade.score) || 0;
                const maxScore = parseFloat(grade.maxScore) || 20;
                average = (score / maxScore) * 20;
              }
              return {
                studentId: grade.studentId,
                average: average
              };
            });
            
            // Trier par moyenne décroissante
            const sortedStudents = studentsWithAverages.sort((a, b) => b.average - a.average);
            
            // Trouver le rang de l'élève actuel
            const studentRank = sortedStudents.findIndex(s => s.studentId === parseInt(studentId)) + 1;
            subjectRanks.set(subject.id, studentRank);
            
            console.log(`🏆 Rang de ${student.nom} en ${subject.name} (fallback): ${studentRank}/${subjectGrades.length} (moyenne: ${studentsWithAverages.find(s => s.studentId === parseInt(studentId))?.average?.toFixed(2) || 'N/A'}/20)`);
          } else {
            subjectRanks.set(subject.id, 1); // Par défaut
          }
        }
      }
      
      // Organiser les matières par catégorie
      const subjectsByCategory = {};
      allSubjects.forEach(subject => {
        const category = subject.category || 'Autre';
        if (!subjectsByCategory[category]) {
          subjectsByCategory[category] = [];
        }
        subjectsByCategory[category].push(subject);
      });
      
      // Afficher les matières par catégorie
      Object.entries(subjectsByCategory).forEach(([category, subjects]) => {
        // Titre de la catégorie (plus compact)
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e40af');
        doc.text(category.toUpperCase(), 20, currentY);
        currentY += 12;
        
        // Matières de cette catégorie (très compactes)
        subjects.forEach((subject, index) => {
          const grade = gradesMap.get(subject.id);
          const subjectRank = subjectRanks.get(subject.id) || 1;
          
          // Debug détaillé pour chaque matière
          console.log(`🔍 Matière ${subject.id} (${subject.name}):`, {
            subjectId: subject.id,
            subjectName: subject.name,
            category: subject.category,
            gradeFound: !!grade,
            gradeData: grade,
            score: grade ? grade.score : 'N/A',
            maxScore: grade ? grade.maxScore : 'N/A',
            rank: subjectRank
          });
          
          // Ligne avec alternance de couleurs (hauteur réduite)
          if (index % 2 === 0) {
            doc.rect(15, currentY - 2, 565, 12).fill('#f9fafb');
          }

          // Nom de la matière (tronqué si trop long)
          const subjectName = (subject.name || 'Matière').substring(0, 18);
          doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000'); // Taille réduite pour les matières
          doc.text(subjectName, 20, currentY);
          doc.fontSize(6).font('Helvetica').fillColor('#000000'); // Taille réduite pour le reste
          
          // Vérification plus robuste des notes
          if (isTrimester) {
            // Affichage pour trimestre (2 séquences + moyenne)
            const trimesterGrade = gradesToUse.find(g => g.subjectId === subject.id);
            
            if (trimesterGrade) {
              const seq1Score = trimesterGrade.seq1Score || 0;
              const seq2Score = trimesterGrade.seq2Score || 0;
              const average = trimesterGrade.average || 0;
              const coef = parseFloat(subject.coefficient) || 1;
              
              console.log(`✅ Notes trimestre pour ${subject.name}: Seq1=${seq1Score}, Seq2=${seq2Score}, Moy=${average.toFixed(2)}`);
              
              doc.text(seq1Score.toString(), 120, currentY);
              doc.text(seq2Score.toString(), 150, currentY);
              doc.text(average.toFixed(2), 180, currentY);
              doc.text(coef.toString(), 210, currentY);
              
              // Total (moyenne × coefficient)
              const total = average * coef;
              doc.text(total.toFixed(2), 240, currentY);
              
              // Vrai rang par matière formaté en français
              doc.text(formatRank(subjectRank), 290, currentY);
              
              // Mention par matière
              const subjectMention = getSubjectMention(average, 20);
              doc.text(subjectMention, 340, currentY);
            } else {
              // Pas de notes pour cette matière
              doc.text('0', 120, currentY);
              doc.text('0', 150, currentY);
              doc.text('0.00', 180, currentY);
              doc.text((parseFloat(subject.coefficient) || 1).toString(), 210, currentY);
              doc.text('0.00', 240, currentY);
              // Vrai rang par matière formaté en français
              doc.text(formatRank(subjectRank), 290, currentY);
              doc.text('N/A', 340, currentY);
            }
          } else {
            // Affichage pour séquence (note unique)
            const grade = gradesToUse.find(g => g.subjectId === subject.id);
            
            if (grade && grade.score !== null && grade.score !== undefined && grade.score !== '') {
              // Note existante
              const score = parseFloat(grade.score);
              const maxScore = parseFloat(grade.maxScore) || 20;
              const coef = parseFloat(subject.coefficient) || 1;
              
              console.log(`✅ Note trouvée pour ${subject.name}: ${score}/${maxScore} (coef: ${coef})`);
              
              doc.text(score.toString(), 140, currentY);
              doc.text(maxScore.toString(), 170, currentY);
              doc.text(coef.toString(), 200, currentY);
              
              // Total (note × coefficient)
              const total = score * coef;
              doc.text(total.toFixed(2), 230, currentY);
              
              // Vrai rang par matière formaté en français
              doc.text(formatRank(subjectRank), 280, currentY);
              
              // Mention par matière
              const subjectMention = getSubjectMention(score, maxScore);
              doc.text(subjectMention, 320, currentY);
            } else {
              // Pas de note - afficher 0 par défaut
              console.log(`❌ Pas de note pour ${subject.name} (${subject.id})`);
              doc.text('0', 140, currentY);
              doc.text('20', 170, currentY);
              doc.text((parseFloat(subject.coefficient) || 1).toString(), 200, currentY);
              doc.text('0.00', 230, currentY);
              // Vrai rang par matière
              doc.text(subjectRank.toString(), 280, currentY);
              doc.text('N/A', 320, currentY);
            }
          }
          
          currentY += 12; // Hauteur de ligne réduite
        });
        
        // Espace entre catégories (réduit)
        currentY += 8;
      });
    } else {
      // Si pas de matières, afficher un message
      doc.text('Aucune matière trouvée', 20, currentY);
      currentY += 16;
    }

    // Bordure finale du tableau
    doc.rect(15, gradesTableTop, 565, currentY - gradesTableTop).stroke('#d1d5db', 1);

    // ===== RÉSULTATS GÉNÉRAUX =====
    const resultsTop = currentY + 8;
    
    // Section des résultats avec fond gris (plus compact)
    doc.rect(15, resultsTop, 565, 45).fill('#f3f4f6').stroke('#d1d5db', 1);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
       .text('RÉSULTATS GÉNÉRAUX / GENERAL RESULTS', 20, resultsTop + 5);

    // Première ligne des résultats
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
    doc.text('Total:', 20, resultsTop + 20);
    doc.text('Coef.:', 120, resultsTop + 20);
    doc.text('Moyenne:', 220, resultsTop + 20);
    doc.text('Rang:', 320, resultsTop + 20);
    doc.text('Mention:', 420, resultsTop + 20);
    doc.text('Moy. Classe:', 520, resultsTop + 20);

        // UTILISER DIRECTEMENT LES RANGS PRÉ-CALCULÉS DU FRONTEND
    console.log('🏆 Utilisation des rangs pré-calculés du frontend...');
    
    let finalRank = 1;
    let finalTotalStudents = 1;
    
    if (calculatedRanks && typeof calculatedRanks === 'object') {
      // Chercher l'élève actuel dans les rangs calculés
      const currentStudentRankData = calculatedRanks[studentId];
      
      console.log(`🔍 Recherche de l'élève ${studentId} dans calculatedRanks...`);
      console.log(`   - Clés disponibles: ${Object.keys(calculatedRanks)}`);
      console.log(`   - Données trouvées:`, currentStudentRankData);
      
      if (currentStudentRankData) {
        finalRank = currentStudentRankData.rank || 1;
        // Utiliser le vrai effectif de la classe envoyé par le frontend
        finalTotalStudents = frontendTotalStudents || currentStudentRankData.totalStudents || 1;
        
        console.log(`✅ Rang trouvé dans calculatedRanks: ${finalRank}/${finalTotalStudents}`);
        console.log(`   - Données de l'élève:`, currentStudentRankData);
        console.log(`   - Effectif de la classe (frontendTotalStudents): ${frontendTotalStudents}`);
        console.log(`   - Effectif de la classe (currentStudentRankData.totalStudents): ${currentStudentRankData.totalStudents}`);
        console.log(`   - Effectif final utilisé: ${finalTotalStudents}`);
      } else {
        console.log(`⚠️ Élève non trouvé dans calculatedRanks, utilisation des valeurs par défaut`);
        finalRank = 1;
        finalTotalStudents = frontendTotalStudents || 1;
        console.log(`   - Effectif par défaut utilisé: ${finalTotalStudents}`);
      }
    } else {
      console.log(`⚠️ calculatedRanks non disponible, utilisation des valeurs par défaut`);
      finalRank = 1;
      finalTotalStudents = frontendTotalStudents || 1;
      console.log(`   - Effectif par défaut utilisé: ${finalTotalStudents}`);
    }
    
    console.log(`🏆 Rang final utilisé dans le PDF: ${finalRank}/${finalTotalStudents}`);
    
    // Valeurs des résultats avec le rang pré-calculé
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827');
    doc.text(`${totalWeightedScore.toFixed(2)}`, 20, resultsTop + 32);
    doc.text(`${totalCoefficient.toFixed(2)}`, 120, resultsTop + 32);
    doc.text(`${average.toFixed(2)}/20`, 220, resultsTop + 32);
    
    // Afficher le rang pré-calculé formaté en français
    doc.text(`${formatRank(finalRank)}`, 320, resultsTop + 32);
    doc.text(mention, 420, resultsTop + 32);
    doc.text(`${classGeneralAverage.toFixed(2)}/20`, 520, resultsTop + 32);

    // ===== APPRÉCIATIONS =====
    const appreciationsTop = resultsTop + 60;
    
    // Section des appréciations avec fond gris clair (taille réduite pour libérer de l'espace)
    doc.rect(15, appreciationsTop, 565, 60).fill('#f9fafb').stroke('#d1d5db', 1);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
       .text('APPRÉCIATIONS / COMMENTS', 20, appreciationsTop + 5);
    
    // Appréciation du professeur titulaire
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
    doc.text('Appréciation du Professeur Titulaire / Class Teacher Comments:', 20, appreciationsTop + 20);
    
    // Zone de texte pour l'appréciation du professeur
    // Utiliser les appréciations récupérées de la base de données
    doc.fontSize(8).font('Helvetica').fillColor('#111827');
    doc.text(teacherComments || 'Aucune appréciation disponible', 20, appreciationsTop + 32, { width: 250 });
    
    // Appréciation du chef d'établissement
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
    doc.text('Appréciation du Chef d\'Établissement / Principal Comments:', 300, appreciationsTop + 20);
    
    // Zone de texte pour l'appréciation du chef d'établissement
    // Utiliser les appréciations récupérées de la base de données
    doc.fontSize(8).font('Helvetica').fillColor('#111827');
    doc.text(principalComments || 'Aucune appréciation disponible', 300, appreciationsTop + 32, { width: 250 });

    // ===== PIED DE PAGE (POSITION FIXE) =====
    // Positionner le footer à la toute fin de la page, peu importe le contenu au-dessus
    const pageHeight = 842; // Hauteur A4 en points
    const footerTop = pageHeight - 120; // 120 points du bas de la page
    
    // Ligne de séparation
    doc.moveTo(15, footerTop).lineTo(580, footerTop).stroke('#e5e7eb', 1);

    // Signatures (plus compactes)
    doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
    
    // Signature du parent
    doc.text('Signature du Parent / Parent Signature:', 15, footerTop + 10);
    doc.rect(15, footerTop + 18, 100, 30).stroke('#9ca3af', 1);
    
    // Date et lieu
    doc.text(`Yaoundé, le ${new Date().toLocaleDateString('fr-FR')}`, 130, footerTop + 25);
    
    // Signature du directeur
    doc.text('Cachet et signature du Directeur / Director Stamp & Signature:', 300, footerTop + 10);
    doc.rect(400, footerTop + 18, 100, 30).stroke('#9ca3af', 1);

    // Finaliser le PDF
    doc.end();

    // Fermer la connexion maintenant que tout est terminé
    connection.release();
    console.log('🔌 Connexion fermée après génération du PDF');

  } catch (error) {
    console.error('Erreur lors de la génération du bulletin:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération du bulletin',
      details: error.message
    });
  }
}
