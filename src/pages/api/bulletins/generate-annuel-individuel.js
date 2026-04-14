import { getPoolFromRequest } from '@/lib/pool-from-request';
import PDFDocument from 'pdfkit';

// Fonction pour formater les rangs en français
function formatRank(rank) {
  if (rank === 1) return '1er';
  if (rank === 2) return '2ème';
  if (rank === 3) return '3ème';
  return `${rank}ème`;
}

// Fonction pour dessiner l'emblème officiel
function drawOfficialEmblem(doc, x, y, size) {
  // Cercle extérieur
  doc.circle(x + size / 2, y + size / 2, size / 2).stroke('#1e40af', 2);

  // Cercle intérieur
  doc.circle(x + size / 2, y + size / 2, size / 3).stroke('#1e40af', 1);

  // Étoile au centre
  doc.fontSize(size / 4).font('Helvetica-Bold').fillColor('#1e40af')
    .text('★', x + size / 2 - 8, y + size / 2 - 8);
}

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

    console.log('🚀 === GÉNÉRATION BULLETIN ANNUEL INDIVIDUEL ===');
    console.log(`👤 Élève: ${studentId}, Classe: ${classId}, Année: ${schoolYear}`);
    const connection = pool;
    // Récupérer l'élève
    const [students] = await connection.query(`
      SELECT * FROM students 
      WHERE id = ? AND anneeScolaire = ?
    `, [studentId, schoolYear]);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const student = students[0];
    console.log(`👤 Élève trouvé: ${student.nom} ${student.prenom}`);

    // Récupérer les informations de la classe
    const [classInfo] = await connection.query(
      'SELECT name FROM school_classes WHERE id = ?',
      [classId]
    );

    const className = classInfo.length > 0 ? classInfo[0].name : classId;

    // Récupérer les informations de l'école
    const [schoolInfo] = await connection.query('SELECT * FROM school_info LIMIT 1');

    // Récupérer les résultats des 3 trimestres
    const [trimesterResults] = await connection.query(`
      SELECT 
        rc.studentId,
        rc.averageScore,
        rc.studentRank,
        rc.totalStudents,
        rc.mention,
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

    if (trimesterResults.length < 3) {
      return res.status(400).json({
        error: `Données incomplètes. ${trimesterResults.length}/3 trimestres disponibles.`
      });
    }

    // Calculer la moyenne annuelle
    const totalAverage = trimesterResults.reduce((sum, t) => sum + parseFloat(t.averageScore || 0), 0);
    const annualAverage = totalAverage / 3;

    // Décision finale
    let finalDecision = 'NON ADMIS';
    if (annualAverage >= 10) {
      finalDecision = 'ADMIS EN CLASSE SUPÉRIEURE';
    } else if (annualAverage >= 8) {
      finalDecision = 'ADMIS AVEC RÉSERVES';
    }

    // Créer le PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    });

    // Définir le type de contenu
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulletin-annuel-${student.nom}-${student.prenom}-${schoolYear}.pdf"`);

    // Pipes le PDF vers la réponse
    doc.pipe(res);

    // En-tête de l'école
    const schoolName = schoolInfo && schoolInfo[0] ? schoolInfo[0].name : 'École Secondaire';
    const schoolAddress = schoolInfo && schoolInfo[0] ? schoolInfo[0].address : 'Yaoundé';
    const schoolEmail = schoolInfo && schoolInfo[0] ? schoolInfo[0].email : 'contact@ecole.cm';

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
      .text(schoolName, 40, 20, { align: 'center', width: 515 });

    doc.fontSize(10).font('Helvetica').fillColor('#374151')
      .text(schoolAddress, 40, 40, { align: 'center', width: 515 })
      .text(schoolEmail, 40, 55, { align: 'center', width: 515 });

    // Logo de l'école
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

    // Titre principal
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af')
      .text('BULLETIN ANNUEL', 40, 80, { align: 'center', width: 515 })
      .fontSize(14).fillColor('#374151')
      .text('ANNUAL REPORT CARD', 40, 100, { align: 'center', width: 515 });

    // Informations de l'élève
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
      .text('INFORMATIONS DE L\'ÉLÈVE / STUDENT INFORMATION', 15, 130);

    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    doc.text(`Nom / Last Name: ${student.nom || 'N/A'}`, 15, 150);
    doc.text(`Prénom / First Name: ${student.prenom || 'N/A'}`, 15, 170);
    doc.text(`Classe / Class: ${student.classe || 'N/A'}`, 15, 190);
    doc.text(`Année scolaire / School Year: ${schoolYear}`, 15, 210);

    // Résultats par trimestre
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
      .text('RÉSULTATS PAR TRIMESTRE / TRIMESTER RESULTS', 15, 250);

    let currentY = 270;
    trimesterResults.forEach((trimester, index) => {
      const trimesterNumber = index + 1;
      const average = parseFloat(trimester.averageScore) || 0;
      const rank = parseInt(trimester.studentRank) || 1;
      const totalStudents = parseInt(trimester.totalStudents) || 1;
      const mention = trimester.mention || 'N/A';

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af')
        .text(`${trimesterNumber}ème Trimestre / ${trimesterNumber}nd Trimester`, 15, currentY);

      currentY += 20;

      doc.fontSize(9).font('Helvetica').fillColor('#374151');
      doc.text(`Moyenne / Average: ${average.toFixed(2)}/20`, 25, currentY);
      doc.text(`Rang / Rank: ${formatRank(rank)}/${totalStudents}`, 25, currentY + 15);
      doc.text(`Mention: ${mention}`, 25, currentY + 30);

      currentY += 50;
    });

    // Résultat annuel
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af')
      .text('RÉSULTAT ANNUEL / ANNUAL RESULT', 15, currentY);

    currentY += 25;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
      .text(`Moyenne Annuelle / Annual Average: ${annualAverage.toFixed(2)}/20`, 25, currentY);

    currentY += 25;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
      .text(`Décision Finale / Final Decision: ${finalDecision}`, 25, currentY);

    // Signature et cachet
    currentY += 50;
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
    doc.text('Signature du Directeur / Director Signature:', 15, currentY);
    doc.rect(15, currentY + 10, 150, 40).stroke('#9ca3af', 1);

    doc.text('Cachet de l\'établissement / School Stamp:', 200, currentY);
    doc.rect(200, currentY + 10, 150, 40).stroke('#9ca3af', 1);

    doc.text('Date:', 400, currentY);
    doc.text(new Date().toLocaleDateString('fr-FR'), 400, currentY + 20);

    // Finaliser le PDF
    doc.end();

    console.log(`✅ Bulletin annuel généré pour ${student.nom} ${student.prenom}`);

    // Fermer la connexion
    console.log('🔌 Connexion fermée');

  } catch (error) {
    console.error('❌ Erreur lors de la génération du bulletin annuel:', error);
    return res.status(500).json({
      error: 'Erreur lors de la génération du bulletin annuel',
      details: error.message
    });
  }
}
