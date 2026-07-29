import { getPoolFromRequest } from '@/lib/pool-from-request';
import PDFDocument from 'pdfkit';

// Fonction pour formater les rangs en français
function formatRank(rank, total) {
  if (!rank || rank === 'N/A') return 'N/A';
  const r = parseInt(rank);
  if (isNaN(r)) return rank;
  const suffix = (r === 1) ? 'er' : 'ème';
  return `${r}${suffix}/${total || '?'}`;
}

// Fonction pour dessiner l'emblème officiel
function drawOfficialEmblem(doc, x, y, size) {
  doc.circle(x + size / 2, y + size / 2, size / 2).stroke('#1e40af', 1);
  doc.circle(x + size / 2, y + size / 2, size / 3).stroke('#1e40af', 0.5);
  doc.fontSize(size / 4).font('Helvetica-Bold').fillColor('#1e40af')
    .text('★', x + size / 2 - 4, y + size / 2 - 4);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const pool = await getPoolFromRequest(req, res);
    const { studentId, classId, schoolYear, decision, targetClass } = req.body;

    if (!studentId || !classId || !schoolYear) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const connection = pool;

    // 1. Récupérer l'élève
    const [students] = await connection.query(`
      SELECT * FROM students WHERE id = ?
    `, [studentId]);

    if (students.length === 0) return res.status(404).json({ error: 'Élève non trouvé' });
    const student = students[0];

    // 2. Récupérer les informations de la classe et de l'école
    const [classInfo] = await connection.query('SELECT name FROM school_classes WHERE id = ?', [classId]);
    const className = classInfo.length > 0 ? classInfo[0].name : classId;
    const [schoolInfoArr] = await connection.query('SELECT * FROM school_info LIMIT 1');
    const schoolInfo = schoolInfoArr[0] || {};

    // 3. Récupérer TOUTES les séquences de l'année
    const [sequences] = await connection.query(`
      SELECT id, name FROM evaluation_periods 
      WHERE schoolYear = ? AND name LIKE '%Séquence%'
      ORDER BY name ASC
    `, [schoolYear]);

    // 4. Récupérer TOUTES les matières de la classe
    const [subjects] = await connection.query(`
      SELECT id, name, coefficient 
      FROM subjects 
      WHERE classId = ? AND schoolYear = ?
      ORDER BY name ASC
    `, [classId, schoolYear]);

    // 5. Récupérer TOUTES les notes de l'élève pour l'année
    const [grades] = await connection.query(`
      SELECT subjectId, evaluationPeriodId, score, maxScore, coefficient 
      FROM grades 
      WHERE studentId = ? AND schoolYear = ?
    `, [studentId, schoolYear]);

    const [reportCards] = await connection.query(`
      SELECT evaluationPeriodId, studentRank, totalStudents, averageScore
      FROM report_cards
      WHERE studentId = ? AND schoolYear = ?
    `, [studentId, schoolYear]);

    // Organiser les données
    const gradesMap = {}; // subjectId -> periodId -> score
    grades.forEach(g => {
      if (!gradesMap[g.subjectId]) gradesMap[g.subjectId] = {};
      const score = parseFloat(g.score) || 0;
      const maxScore = parseFloat(g.maxScore) || 20;
      const normalizedScore = maxScore > 0 ? (score / maxScore) * 20 : score;
      gradesMap[g.subjectId][g.evaluationPeriodId] = normalizedScore;
    });

    const sequenceRanks = {}; // periodId -> {rank, total}
    reportCards.forEach(rc => {
      sequenceRanks[rc.evaluationPeriodId] = { rank: rc.studentRank, total: rc.totalStudents, avg: rc.averageScore };
    });

    // Créer le PDF (En paysage pour faire tenir toutes les colonnes)
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Bulletin_Annuel_${student.nom}.pdf"`);
    doc.pipe(res);

    // En-tête (Style réduit pour laisser place au tableau)
    doc.fontSize(14).font('Helvetica-Bold').text(schoolInfo.name || 'FOSILAMASTER ACADEMY', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text(schoolInfo.address || '', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af').text('BILAN ANNUEL DES RÉSULTATS', { align: 'center' });
    doc.fontSize(10).fillColor('#475569').text(`Année Scolaire: ${schoolYear}`, { align: 'center' });
    doc.moveDown(1);

    // Infos élève
    const infoY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('ÉLÈVE:', 30, infoY);
    doc.font('Helvetica').fillColor('#000').text(`${student.nom} ${student.prenom}`, 80, infoY);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('CLASSE:', 350, infoY);
    doc.font('Helvetica').fillColor('#000').text(className, 410, infoY);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('MATRICULE:', 600, infoY);
    doc.font('Helvetica').fillColor('#000').text(student.id, 680, infoY);

    doc.moveDown(1.5);

    // Tableau des résultats
    const tableTop = doc.y;

    // Header du tableau
    doc.rect(30, tableTop, 780, 25).fill('#f1f5f9');
    doc.strokeColor('#cbd5e1').lineWidth(0.5);
    doc.rect(30, tableTop, 780, 25).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('MATIÈRES', 35, tableTop + 8);
    doc.text('COEF', 170, tableTop + 8);

    sequences.forEach((seq, i) => {
      const shortName = seq.name.replace('Séquence ', 'SEQ ');
      doc.text(shortName, 200 + (i * 75), tableTop + 8, { width: 70, align: 'center' });
    });

    doc.text('MOY. ANN.', 650 + 5, tableTop + 8, { width: 60, align: 'center' });
    doc.text('RANG', 715 + 5, tableTop + 8, { width: 60, align: 'center' });

    let currentY = tableTop + 25;
    let totalAnnWeight = 0;
    let totalCoef = 0;

    subjects.forEach((subject) => {
      doc.rect(30, currentY, 780, 20).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text(subject.name.substring(0, 25), 35, currentY + 6);
      doc.font('Helvetica').text(subject.coefficient.toString(), 170, currentY + 6, { width: 30, align: 'center' });

      let rowSum = 0;
      let count = 0;

      sequences.forEach((seq, i) => {
        const score = gradesMap[subject.id]?.[seq.id];
        const displayScore = score !== undefined ? score.toFixed(2) : '-';
        doc.text(displayScore, 200 + (i * 75), currentY + 6, { width: 70, align: 'center' });
        if (score !== undefined) {
          rowSum += score;
          count++;
        }
      });

      const annAvg = count > 0 ? rowSum / count : 0;
      const coef = parseFloat(subject.coefficient) || 1;
      totalAnnWeight += annAvg * coef;
      totalCoef += coef;

      doc.font('Helvetica-Bold').fillColor('#1e40af').text(annAvg.toFixed(2), 650 + 5, currentY + 6, { width: 60, align: 'center' });
      doc.font('Helvetica').fillColor('#475569').text('-', 715 + 5, currentY + 6, { width: 60, align: 'center' });

      currentY += 20;
    });

    // Pied de tableau : Moyennes Générales
    const finalAnnAvg = totalCoef > 0 ? totalAnnWeight / totalCoef : 0;

    doc.moveDown(1);
    currentY = doc.y;
    doc.rect(30, currentY, 780, 50).fill('#f8fafc');
    doc.rect(30, currentY, 780, 50).stroke();

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('RÉSUMÉ DES PERFORMANCES PAR SÉQUENCE', 40, currentY + 10);

    doc.fontSize(8).fillColor('#475569');
    sequences.forEach((seq, i) => {
      const data = sequenceRanks[seq.id];
      const text = data ? `MOY: ${parseFloat(data.avg).toFixed(2)} | RG: ${data.rank}/${data.total}` : 'N/A';
      doc.text(text, 200 + (i * 75), currentY + 30, { width: 70, align: 'center' });
    });

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text(`MOYENNE ANNUELLE : ${finalAnnAvg.toFixed(2)} / 20`, 580, currentY + 18, { align: 'right', width: 200 });

    // Décision finale
    doc.moveDown(2.5);
    const decisionY = doc.y;
    doc.rect(30, decisionY, 780, 45).strokeColor('#1e40af').lineWidth(1.5).stroke();

    const displayDecision = (decision === 'pass' ? 'ADMIS(E) EN CLASSE SUPÉRIEURE' : (decision === 'exclude' ? 'EXCLU(E) DE L\'ÉTABLISSEMENT' : 'REDOUBLE LA CLASSE'));
    const displayTarget = targetClass || className;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('DÉCISION DU CONSEIL DE CLASSE :', 45, decisionY + 10);
    doc.fontSize(14).fillColor('#b91c1c').text(displayDecision, 250, decisionY + 8);

    if (decision === 'pass') {
      doc.fontSize(11).fillColor('#1e40af').text(`PROMU(E) EN :`, 510, decisionY + 10);
      doc.fontSize(14).fillColor('#15803d').text(displayTarget, 610, decisionY + 8);
    }

    // Signatures
    doc.moveDown(3);
    const signY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155');
    doc.text("Signature du Parent", 100, signY);
    doc.text("Le Titulaire de la Classe", 350, signY);
    doc.text("Le Chef d'Établissement", 600, signY);

    doc.end();

  } catch (error) {
    console.error('❌ Error generating annual report:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
}
