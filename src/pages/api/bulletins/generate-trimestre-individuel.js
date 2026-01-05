// Fichier vide pour l'API des bulletins trimestres individuels
import pool from '../../../db/mysql-pool';
import PDFDocument from 'pdfkit';

// Fonction pour formater les rangs en français (même que dans generate-all.js)
function formatRank(rank) {
  if (rank === 1) return '1er';
  if (rank === 2) return '2ème';
  if (rank === 3) return '3ème';
  return `${rank}ème`;
}

// Fonction pour dessiner l'emblème officiel (même que dans generate-all.js)
function drawOfficialEmblem(doc, x, y, size) {
  // Cercle extérieur
  doc.circle(x + size/2, y + size/2, size/2).stroke('#1e40af', 2);
  
  // Cercle intérieur
  doc.circle(x + size/2, y + size/2, size/3).stroke('#1e40af', 1);
  
  // Étoile au centre
  doc.fontSize(size/4).font('Helvetica-Bold').fillColor('#1e40af')
     .text('★', x + size/2 - 8, y + size/2 - 8);
}

// Fonction pour calculer la mention par matière
function getSubjectMention(score) {
  if (score >= 18) return 'Excellent';
  if (score >= 16) return 'Très Bien';
  if (score >= 14) return 'Bien';
  if (score >= 12) return 'Assez Bien';
  if (score >= 10) return 'Passable';
  return 'Insuffisant';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { studentId, evaluationPeriodId, schoolYear, classId } = req.body;

    if (!studentId || !evaluationPeriodId || !schoolYear || !classId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    console.log('🚀 === GÉNÉRATION BULLETIN TRIMESTRE INDIVIDUEL ===');
    console.log(`👤 Élève: ${studentId}, Période: ${evaluationPeriodId}, Année: ${schoolYear}, Classe: ${classId}`);

    const connection = ;

    // Récupérer l'élève spécifique
    const [students] = await connection.query(`
      SELECT * FROM students 
      WHERE id = ? AND anneeScolaire = ?
    `, [studentId, schoolYear]);

    if (students.length === 0) {      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const student = students[0];
    console.log(`👤 Élève trouvé: ${student.nom} ${student.prenom}`);

    // Récupérer le nom complet de la classe depuis la table school_classes
    const [classInfo] = await connection.query(
      'SELECT name FROM school_classes WHERE id = ?',
      [classId]
    );
    
    const className = classInfo.length > 0 ? classInfo[0].name : classId;

    // Récupérer tous les élèves de la classe pour le calcul des rangs
    const [allStudents] = await connection.query(`
      SELECT * FROM students 
      WHERE classe = ? AND anneeScolaire = ?
      ORDER BY nom, prenom
    `, [className, schoolYear]);

    console.log(`👥 ${allStudents.length} élèves trouvés pour la classe ${className}`);

    // Récupérer les informations de la période
    const [periods] = await connection.query(
      'SELECT * FROM evaluation_periods WHERE id = ?',
      [evaluationPeriodId]
    );

    const period = periods[0];
    
    // Vérifier si c'est un trimestre
    const isTrimester = period && period.name && (period.name.toLowerCase().includes('trim') || period.name.toLowerCase().includes('trimester'));
    
    console.log(`📝 Type de période: ${isTrimester ? 'TRIMESTRE' : 'SÉQUENCE'}`);

    if (!isTrimester) {      return res.status(400).json({ error: 'Cette API est uniquement pour les bulletins de trimestre' });
    }

    // Récupérer les informations de l'école
    const [schoolInfo] = await connection.query('SELECT * FROM school_info LIMIT 1');

    // Récupérer les appréciations sauvegardées pour cet élève
    const [savedComments] = await connection.query(
      'SELECT teacherComments, principalComments FROM report_cards WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?',
      [studentId, evaluationPeriodId, schoolYear]
    );
    
    let teacherComments = '';
    let principalComments = '';
    
    if (savedComments.length > 0) {
      teacherComments = savedComments[0].teacherComments || '';
      principalComments = savedComments[0].principalComments || '';
      console.log(`✅ Appréciations trouvées pour ${student.nom}`);
    } else {
      console.log(`⚠️ Aucune appréciation trouvée pour ${student.nom}`);
    }

    // Récupérer la photo de l'élève depuis la table students
    const studentPhotoUrl = student.photoUrl;

    // Récupérer les notes de l'élève (LOGIQUE EXACTEMENT IDENTIQUE À generate-all.js)
    let grades = [];
    
    // CORRECTION : Pour les trimestres, récupérer les notes des séquences correspondantes selon le trimestre
    let sequences = [];
    
    // Déterminer le numéro du trimestre à partir du nom de la période
    const trimesterNumber = period.name.match(/(\d+)/)?.[1];
    console.log(`🔍 Numéro du trimestre détecté: ${trimesterNumber}`);
    
    if (trimesterNumber) {
      const trimNum = parseInt(trimesterNumber);
      
      // Calculer les indices des séquences selon le trimestre
      let startSeq, endSeq;
      
      if (trimNum === 1) {
        // 1er trimestre : séquences 1 et 2
        startSeq = 1;
        endSeq = 2;
      } else if (trimNum === 2) {
        // 2ème trimestre : séquences 3 et 4
        startSeq = 3;
        endSeq = 4;
      } else if (trimNum === 3) {
        // 3ème trimestre : séquences 5 et 6
        startSeq = 5;
        endSeq = 6;
      } else {
        // Fallback : utiliser les 2 premières séquences
        startSeq = 1;
        endSeq = 2;
        console.log('⚠️ Trimestre non reconnu, utilisation des 2 premières séquences');
      }
      
      console.log(`📚 Trimestre ${trimNum}: séquences ${startSeq} à ${endSeq}`);
      
      // Récupérer les séquences correspondantes
      const [allSequences] = await connection.query(`
        SELECT id, name FROM evaluation_periods 
        WHERE schoolYear = ? AND type = 'sequence'
        ORDER BY name
      `, [schoolYear]);
      
      // Filtrer les séquences selon le trimestre
      sequences = allSequences.filter((seq, index) => {
        const seqNumber = seq.name.match(/(\d+)/)?.[1];
        return seqNumber && parseInt(seqNumber) >= startSeq && parseInt(seqNumber) <= endSeq;
      });
      
      console.log(`📚 Séquences trouvées pour le trimestre ${trimNum}: ${sequences.map(s => s.name).join(', ')}`);
    } else {
      // Fallback : utiliser les 2 premières séquences
      const [fallbackSequences] = await connection.query(`
        SELECT id, name FROM evaluation_periods 
        WHERE schoolYear = ? AND type = 'sequence'
        ORDER BY name
        LIMIT 2
      `, [schoolYear]);
      sequences = fallbackSequences;
      console.log(`⚠️ Fallback: séquences trouvées: ${sequences.map(s => s.name).join(', ')}`);
    }
    
    // Récupérer les notes de la 1ère séquence du trimestre
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
    `, [studentId, sequences[0]?.id, schoolYear]);
     
    // Récupérer les notes de la 2ème séquence du trimestre (si disponible)
    let seq2Grades = [];
    if (sequences.length > 1) {
      const [seq2GradesResult] = await connection.query(`
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
      `, [studentId, sequences[1].id, schoolYear]);
      seq2Grades = seq2GradesResult;
    }
    
    // Combiner les notes des deux séquences (LOGIQUE EXACTEMENT IDENTIQUE)
    const gradesBySubject = new Map();
    
    // Ajouter les notes de la 1ère séquence
    seq1Grades.forEach(grade => {
      gradesBySubject.set(grade.subjectId, {
        ...grade,
        seq1Score: parseFloat(grade.score) || 0,
        seq1MaxScore: parseFloat(grade.maxScore) || 20
      });
    });
    
    // Ajouter ou mettre à jour avec les notes de la 2ème séquence
    seq2Grades.forEach(grade => {
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
    
    // Convertir en tableau
    grades = Array.from(gradesBySubject.values());

    // Calculer la moyenne et le total (LOGIQUE EXACTEMENT IDENTIQUE)
    let totalWeightedScore = 0;
    let totalCoefficient = 0;
    
    grades.forEach(grade => {
      // Pour les trimestres, calculer la moyenne des 2 séquences
      const seq1Score = grade.seq1Score || 0;
      const seq2Score = grade.seq2Score || 0;
      const score = (seq1Score + seq2Score) / 2; // Moyenne des 2 séquences
      const maxScore = Math.max(grade.seq1MaxScore || 20, grade.seq2MaxScore || 20);
      
      const coef = parseFloat(grade.coefficient) || 1;
      totalWeightedScore += score * coef;
      totalCoefficient += coef;
    });

    const average = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;
    
    // NOUVEAU : Logique spéciale pour le 3ème trimestre (moyenne annuelle et décision finale)
    let annualAverage = 0;
    let finalDecision = '';
    
    if (trimesterNumber && parseInt(trimesterNumber) === 3) {
      console.log('🎯 3ème trimestre détecté - Calcul de la moyenne annuelle et décision finale');
      
      try {
        // Récupérer les moyennes des 3 trimestres
        const [trimesterAverages] = await connection.query(`
          SELECT 
            ep.name as periodName,
            rc.average as trimesterAverage
          FROM report_cards rc
          JOIN evaluation_periods ep ON rc.evaluationPeriodId = ep.id
          WHERE rc.studentId = ? 
            AND rc.schoolYear = ? 
            AND ep.name LIKE '%trimestre%'
            AND ep.name != ?
          ORDER BY ep.name
        `, [studentId, schoolYear, period.name]);
        
        console.log(`📊 Moyennes des trimestres trouvées:`, trimesterAverages);
        
        if (trimesterAverages.length >= 2) {
          // Calculer la moyenne annuelle (moyenne des 3 trimestres)
          const currentTrimesterAverage = average;
          const previousTrimestersAverage = trimesterAverages.reduce((sum, t) => sum + parseFloat(t.trimesterAverage || 0), 0);
          annualAverage = (currentTrimesterAverage + previousTrimestersAverage) / 3;
          
          console.log(`📈 Moyenne annuelle calculée: ${annualAverage.toFixed(2)}`);
          
          // Décision finale basée sur la moyenne annuelle
          if (annualAverage >= 10) {
            finalDecision = 'ADMIS EN CLASSE SUPÉRIEURE';
          } else if (annualAverage >= 8) {
            finalDecision = 'ADMIS AVEC RÉSERVES';
          } else {
            finalDecision = 'NON ADMIS';
          }
          
          console.log(`🎯 Décision finale: ${finalDecision}`);
        } else {
          console.log('⚠️ Pas assez de trimestres précédents pour calculer la moyenne annuelle');
        }
      } catch (error) {
        console.error('❌ Erreur lors du calcul de la moyenne annuelle:', error);
      }
    }

    // Calculer le rang général (LOGIQUE EXACTEMENT IDENTIQUE)
    const studentAverages = await Promise.all(
      allStudents.map(async (s) => {
        let totalWeighted = 0;
        let totalCoeff = 0;
        
        // Pour les trimestres, calculer sur les moyennes des 2 séquences
        if (sequences.length > 0) {
                                           // Récupérer les notes de la 1ère séquence - MÊME LOGIQUE QUE generate-all.js
            const [seq1Grades] = await connection.query(`
              SELECT 
                g.score,
                g.subjectId,
                s.coefficient
              FROM grades g
              LEFT JOIN subjects s ON g.subjectId = s.id
              WHERE g.studentId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
            `, [s.id, sequences[0].id, schoolYear]);
          
                                           // Récupérer les notes de la 2ème séquence (si disponible) - MÊME LOGIQUE QUE generate-all.js
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
        
        return {
          studentId: s.id,
          average: totalCoeff > 0 ? totalWeighted / totalCoeff : 0
        };
      })
    );

         const sortedAverages = studentAverages.sort((a, b) => b.average - a.average);
     const rank = sortedAverages.findIndex(s => s.studentId === student.id) + 1;
     
     // Calculer la moyenne générale de la classe
     const classGeneralAverage = studentAverages.length > 0 
       ? studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length 
       : 0;

         // Calculer les rangs par matière et les moyennes de classe (LOGIQUE EXACTEMENT IDENTIQUE)
     const subjectRanks = new Map();
     const subjectClassAverages = new Map();
     
     for (const grade of grades) {
       if (grade.subjectId) {
         let subjectGrades = [];
         
         // Pour les trimestres, calculer les rangs sur les moyennes des 2 séquences
         if (sequences.length > 0) {
           // Récupérer toutes les notes de la 1ère séquence pour cette matière
           const [seq1Grades] = await connection.query(`
             SELECT 
               g.studentId,
               g.score,
               g.maxScore
             FROM grades g
             WHERE g.subjectId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
             AND g.score IS NOT NULL AND g.score != ''
           `, [grade.subjectId, sequences[0].id, schoolYear]);
           
           // Récupérer toutes les notes de la 2ème séquence pour cette matière
           let seq2Grades = [];
           if (sequences.length > 1) {
             const [seq2GradesResult] = await connection.query(`
               SELECT 
                 g.studentId,
                 g.score,
               g.maxScore
             FROM grades g
               WHERE g.subjectId = ? AND g.evaluationPeriodId = ? AND g.schoolYear = ?
               AND g.score IS NOT NULL AND g.score != ''
             `, [grade.subjectId, sequences[1].id, schoolYear]);
             seq2Grades = seq2GradesResult;
           }
           
           // Combiner les notes des deux séquences pour calculer les moyennes
           const gradesByStudent = new Map();
           
           // Ajouter les notes de la 1ère séquence
           seq1Grades.forEach(g => {
             gradesByStudent.set(g.studentId, {
               seq1Score: parseFloat(g.score) || 0,
               maxScore: parseFloat(g.maxScore) || 20
             });
           });
           
           // Ajouter ou mettre à jour avec les notes de la 2ème séquence
           seq2Grades.forEach(g => {
             if (gradesByStudent.has(g.studentId)) {
               const existing = gradesByStudent.get(g.studentId);
               existing.seq2Score = parseFloat(g.score) || 0;
             } else {
               gradesByStudent.set(g.studentId, {
                 seq1Score: 0,
                 seq2Score: parseFloat(g.score) || 0,
                 maxScore: parseFloat(g.maxScore) || 20
               });
             }
           });
           
           // Convertir en tableau avec les moyennes calculées
           subjectGrades = Array.from(gradesByStudent.entries()).map(([studentId, grades]) => ({
             studentId,
             score: (grades.seq1Score + grades.seq2Score) / 2, // Moyenne des 2 séquences
             maxScore: Math.max(grades.maxScore, grades.maxScore)
           }));
         }

         // Calculer le rang pour cette matière
         if (subjectGrades.length > 0) {
           const sortedSubjectGrades = subjectGrades
             .map(g => ({
               studentId: g.studentId,
               score: parseFloat(g.score) || 0,
               maxScore: parseFloat(g.maxScore) || 20
             }))
             .sort((a, b) => b.score - a.score);

           const subjectRank = sortedSubjectGrades.findIndex(g => g.studentId === student.id) + 1;
           subjectRanks.set(grade.subjectId, subjectRank);
           
           // Calculer la moyenne de la classe pour cette matière
           const totalSubjectScore = subjectGrades.reduce((sum, g) => sum + g.score, 0);
           const classAverage = subjectGrades.length > 0 ? totalSubjectScore / subjectGrades.length : 0;
           subjectClassAverages.set(grade.subjectId, classAverage);
         }
       }
     }

    // Déterminer la mention
    const getMention = (avg) => {
      if (avg >= 18) return 'Excellent';
      if (avg >= 16) return 'Très Bien';
      if (avg >= 14) return 'Bien';
      if (avg >= 12) return 'Assez Bien';
      if (avg >= 10) return 'Passable';
      return 'Insuffisant';
    };

    const mention = getMention(average);

    // Générer le PDF pour cet élève (MÊME FORMAT QUE generate-all.js)
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
          top: 20,
          bottom: 20,
          left: 15,
          right: 15
      }
    });

    // Configuration de la réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulletin_trimestre_${student.nom}_${student.prenom}_${evaluationPeriodId}.pdf`);

    // Pipe le PDF vers la réponse
    doc.pipe(res);

         // ===== EN-TÊTE DU BULLETIN (MÊME FORMAT QUE generate-all.js) =====
     const ministryFrench = 'MINISTÈRE DE L\'ENSEIGNEMENT SECONDAIRE';
     const ministryEnglish = 'MINISTRY OF SECONDARY EDUCATION';
     const schoolTypeFrench = 'ÉCOLE SECONDAIRE';
     const schoolTypeEnglish = 'SECONDARY SCHOOL';

     // Section gauche (français)
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

     // Section droite (anglais)
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

     // Logo de l'école au centre
     const logoX = 250;
     const logoY = 15;
     const logoSize = 40;
     
     if (schoolInfo && schoolInfo[0] && schoolInfo[0].logoUrl) {
       try {
         doc.image(schoolInfo[0].logoUrl, logoX, logoY, { width: logoSize, height: logoSize });
       } catch (error) {
         drawOfficialEmblem(doc, logoX, logoY, logoSize);
       }
     } else {
       drawOfficialEmblem(doc, logoX, logoY, logoSize);
     }

     // Titre principal du bulletin
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

     // Position normale des informations de l'élève (section des séquences supprimée)
     const studentInfoTop = 170;

     // ===== INFORMATIONS DE L'ÉLÈVE =====
     doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af')
        .text('INFORMATIONS DE L\'ÉLÈVE / STUDENT INFORMATION', 15, studentInfoTop);

     // Photo de l'élève (position ajustée selon la section des séquences)
     const photoX = 15;
     const photoY = studentInfoTop + 15; // Ajusté selon la nouvelle position
     const photoSize = 60;
     
     if (studentPhotoUrl) {
       try {
         // Si c'est une data URI ou URL
         if (studentPhotoUrl.startsWith('data:image/') || studentPhotoUrl.startsWith('http')) {
           doc.image(studentPhotoUrl, photoX, photoY, { width: photoSize, height: photoSize });
         } else {
           // Si c'est un chemin local
           doc.image(studentPhotoUrl, photoX, photoY, { width: photoSize, height: photoSize });
         }
         console.log(`📸 Photo chargée pour ${student.nom}`);
       } catch (error) {
         console.log(`⚠️ Erreur photo pour ${student.nom}, utilisation de l'avatar par défaut`);
         // Avatar par défaut plus professionnel
         const avatarCenterX = photoX + photoSize/2;
         const avatarCenterY = photoY + photoSize/2;
         
         // Cercle de fond
         doc.circle(avatarCenterX, avatarCenterY, photoSize/2).fill('#e5e7eb');
         doc.circle(avatarCenterX, avatarCenterY, photoSize/2).stroke('#9ca3af', 1);
         
         // Initiales de l'élève
         const initials = `${student.prenom ? student.prenom.charAt(0) : ''}${student.nom ? student.nom.charAt(0) : ''}`.toUpperCase();
         doc.fontSize(photoSize/3).font('Helvetica-Bold').fillColor('#6b7280')
            .text(initials, avatarCenterX, avatarCenterY + photoSize/6, { align: 'center' });
       }
     } else {
       console.log(`⚠️ Aucune photo trouvée pour ${student.nom}, utilisation de l'avatar par défaut`);
       // Avatar par défaut plus professionnel
       const avatarCenterX = photoX + photoSize/2;
       const avatarCenterY = photoY + photoSize/2;
       
       // Cercle de fond
       doc.circle(avatarCenterX, avatarCenterY, photoSize/2).fill('#e5e7eb');
       doc.circle(avatarCenterX, avatarCenterY, photoSize/2).stroke('#9ca3af', 1);
       
       // Initiales de l'élève
       const initials = `${student.prenom ? student.prenom.charAt(0) : ''}${student.nom ? student.nom.charAt(0) : ''}`.toUpperCase();
       doc.fontSize(photoSize/3).font('Helvetica-Bold').fillColor('#6b7280')
          .text(initials, avatarCenterX, avatarCenterY + photoSize/6, { align: 'center' });
     }

     // Informations de l'élève à côté de la photo (position ajustée)
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
          type: 'Trimestre'
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
        grades: grades.map(grade => ({
          subject: grade.subjectName,
          category: grade.category,
          seq1Score: grade.seq1Score || 0,
          seq2Score: grade.seq2Score || 0,
          average: ((grade.seq1Score || 0) + (grade.seq2Score || 0)) / 2,
          coefficient: grade.coefficient,
          total: ((grade.seq1Score || 0) + (grade.seq2Score || 0)) / 2 * (grade.coefficient || 1),
          rank: subjectRanks.get(grade.subjectId) || 1,
          mention: getSubjectMention(((grade.seq1Score || 0) + (grade.seq2Score || 0)) / 2)
        })),
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
     const gradesTableTop = photoY + photoSize + 32; // Exactement comme dans generate-all.js
     
     // Titre du tableau des notes
     const titleText = 'NOTES DU TRIMESTRE / TRIMESTER GRADES';
     doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af')
        .text(titleText, 15, photoY + photoSize + 20);
     
     // Fond gris pour les en-têtes (comme dans l'API individuelle)
     doc.rect(15, gradesTableTop, 565, 14).fill('#f3f4f6');
     
     // CORRECTION : En-têtes dynamiques selon le trimestre
     doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000'); // Taille et couleur exactes de l'API individuelle
     
     // Déterminer les noms des séquences selon le trimestre
     let seq1Label = 'Seq1';
     let seq2Label = 'Seq2';
     
     if (trimesterNumber) {
       const trimNum = parseInt(trimesterNumber);
       if (trimNum === 1) {
         seq1Label = 'Seq1';
         seq2Label = 'Seq2';
       } else if (trimNum === 2) {
         seq1Label = 'Seq3';
         seq2Label = 'Seq4';
       } else if (trimNum === 3) {
         seq1Label = 'Seq5';
         seq2Label = 'Seq6';
       }
     }
     
     // En-têtes pour trimestre (2 séquences + moyenne) - coordonnées exactes de l'API individuelle
     doc.text('Matière', 20, gradesTableTop + 4);
     doc.text(seq1Label, 120, gradesTableTop + 4);
     doc.text(seq2Label, 150, gradesTableTop + 4);
     doc.text('Moy.', 180, gradesTableTop + 4);
     doc.text('Coef.', 210, gradesTableTop + 4);
     doc.text('Total', 240, gradesTableTop + 4);
     doc.text('Rang', 290, gradesTableTop + 4);
     doc.text('Mention', 340, gradesTableTop + 4);

     // Ligne de séparation
     doc.moveTo(15, gradesTableTop + 10).lineTo(580, gradesTableTop + 10).stroke('#e5e7eb', 1);

     // Contenu du tableau
     let currentY = gradesTableTop + 20;
     doc.fontSize(8).font('Helvetica').fillColor('#374151');

     // Grouper les notes par catégorie
     const gradesByCategory = {};
     grades.forEach(grade => {
       const category = grade.category || 'AUTRE';
       if (!gradesByCategory[category]) {
         gradesByCategory[category] = [];
       }
       gradesByCategory[category].push(grade);
     });

     // Afficher les notes par catégorie
     Object.entries(gradesByCategory).forEach(([category, categoryGrades]) => {
       // Titre de la catégorie
       doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e40af');
       doc.text(category.toUpperCase(), 20, currentY);
       currentY += 12;
       
       // Notes de cette catégorie
       categoryGrades.forEach((grade, index) => {
         // Ligne avec alternance de couleurs
         if (index % 2 === 0) {
           doc.rect(15, currentY - 2, 565, 12).fill('#f9fafb');
         }

                   // Mention par matière - basée sur la MOYENNE des 2 séquences
          const getSubjectMention = (score) => {
            // score est déjà sur 20 (moyenne des 2 séquences)
            if (score >= 18) return 'Excellent';
            if (score >= 16) return 'Très Bien';
            if (score >= 14) return 'Bien';
            if (score >= 12) return 'Assez Bien';
            if (score >= 10) return 'Passable';
            return 'Insuffisant';
          };
          
          // Calculer la moyenne des 2 séquences pour la mention
          const moyScore = ((grade.seq1Score || 0) + (grade.seq2Score || 0)) / 2;
          const subjectMention = getSubjectMention(moyScore);

         doc.fontSize(7).font('Helvetica').fillColor('#000000');
         doc.text(grade.subjectName.substring(0, 18), 20, currentY);
         
         // Affichage pour trimestre - coordonnées exactes de l'API individuelle
         const seq1Score = grade.seq1Score || 0;
         const seq2Score = grade.seq2Score || 0;
         const coef = parseFloat(grade.coefficient) || 1;
         const total = moyScore * coef;
         
         doc.text(seq1Score.toString(), 120, currentY);
         doc.text(seq2Score.toString(), 150, currentY);
         doc.text(moyScore.toFixed(2), 180, currentY);
         doc.text(coef.toString(), 210, currentY);
         doc.text(total.toFixed(2), 240, currentY);
         
                   // Utiliser le vrai rang par matière calculé
          const realSubjectRank = subjectRanks.get(grade.subjectId) || 1;
          doc.text(formatRank(realSubjectRank), 290, currentY);
          doc.text(subjectMention, 340, currentY);

         currentY += 12; // Hauteur de ligne réduite (comme dans l'API individuelle)
       });
       
       currentY += 5;
     });

     // Bordure finale du tableau
     doc.rect(15, gradesTableTop, 565, currentY - gradesTableTop).stroke('#d1d5db', 1);

     // ===== RÉSULTATS GÉNÉRAUX =====
     const resultsTop = currentY + 8;
     
     // Section des résultats avec fond gris
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

           // Valeurs des résultats
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827');
           doc.text(`${totalWeightedScore.toFixed(2)}`, 20, resultsTop + 32);
     doc.text(`${totalCoefficient.toFixed(2)}`, 120, resultsTop + 32);
     doc.text(`${average.toFixed(2)}/20`, 220, resultsTop + 32);
     doc.text(`${formatRank(rank)}`, 320, resultsTop + 32);
     doc.text(mention, 420, resultsTop + 32);
     doc.text(`${classGeneralAverage.toFixed(2)}/20`, 520, resultsTop + 32);

     // NOUVEAU : Section spéciale pour le 3ème trimestre (moyenne annuelle et décision finale)
     let appreciationsTop;
     if (trimesterNumber && parseInt(trimesterNumber) === 3 && annualAverage > 0) {
       const annualResultsTop = resultsTop + 50;
       
       // Section de la moyenne annuelle avec fond bleu clair
       doc.rect(15, annualResultsTop, 565, 35).fill('#dbeafe').stroke('#3b82f6', 1);
       
       doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
          .text('RÉSULTAT ANNUEL / ANNUAL RESULT', 20, annualResultsTop + 5);
       
       // Informations de la moyenne annuelle
       doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af');
       doc.text('Moyenne Annuelle / Annual Average:', 20, annualResultsTop + 20);
       doc.text('Décision Finale / Final Decision:', 300, annualResultsTop + 20);
       
       // Valeurs
       doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827');
       doc.text(`${annualAverage.toFixed(2)}/20`, 20, annualResultsTop + 32);
       doc.text(finalDecision, 300, annualResultsTop + 32);
       
       // Ajuster la position des appréciations
       appreciationsTop = annualResultsTop + 50;
     } else {
       // Position normale des appréciations
       appreciationsTop = resultsTop + 60;
     }

     // ===== APPRÉCIATIONS =====
      
      // Section des appréciations avec fond gris clair (taille réduite pour libérer de l'espace)
      doc.rect(15, appreciationsTop, 565, 60).fill('#f9fafb').stroke('#d1d5db', 1);
     
     doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
        .text('APPRÉCIATIONS / COMMENTS', 20, appreciationsTop + 5);
     
     // Appréciation du professeur titulaire
     doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
     doc.text('Appréciation du Professeur Titulaire / Class Teacher Comments:', 20, appreciationsTop + 20);
     
     // Zone de texte pour l'appréciation du professeur
     doc.fontSize(8).font('Helvetica').fillColor('#111827');
     doc.text(teacherComments || 'Aucune appréciation disponible', 20, appreciationsTop + 32, { width: 250 });
     
     // Appréciation du chef d'établissement
     doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
     doc.text('Appréciation du Chef d\'Établissement / Principal Comments:', 300, appreciationsTop + 20);
     
     // Zone de texte pour l'appréciation du chef d'établissement
     doc.fontSize(8).font('Helvetica').fillColor('#111827');
     doc.text(principalComments || 'Aucune appréciation disponible', 300, appreciationsTop + 32, { width: 250 });

     // ===== PIED DE PAGE =====
     const pageHeight = 842;
     const footerTop = pageHeight - 120;
     
     // Ligne de séparation
     doc.moveTo(15, footerTop).lineTo(580, footerTop).stroke('#e5e7eb', 1);

     // Signatures
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
     
     console.log(`✅ Bulletin trimestre généré pour ${student.nom} ${student.prenom}`);
     
     // Fermer la connexion     console.log('🔌 Connexion fermée');

   } catch (error) {
     console.error('❌ Erreur lors de la génération du bulletin trimestre:', error);
     return res.status(500).json({ 
       error: 'Erreur lors de la génération du bulletin trimestre',
       details: error.message
     });
   }
 }