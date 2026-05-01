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
  doc.circle(x + size / 2, y + size / 2, size / 2).stroke('#1e40af', 2);
  doc.circle(x + size / 2, y + size / 2, size / 3).stroke('#1e40af', 1);
  doc.fontSize(size / 4).font('Helvetica-Bold').fillColor('#1e40af')
    .text('★', x + size / 2 - 8, y + size / 2 - 8);
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let connection;
  try {
    const { studentId, evaluationPeriodId, schoolYear, classId } = req.body;
    if (!studentId || !evaluationPeriodId || !schoolYear || !classId) return res.status(400).json({ error: 'Paramètres manquants' });

    const pool = await getPoolFromRequest(req, res);
    connection = await pool.getConnection();

    // 1. Infos globales
    const [classInfo] = await connection.query('SELECT name FROM school_classes WHERE id = ?', [classId]);
    const className = classInfo.length > 0 ? classInfo[0].name : classId;
    const [students] = await connection.query(
      'SELECT * FROM students WHERE classe = ? AND anneeScolaire = ? ORDER BY nom, prenom',
      [className, schoolYear]
    );
    const [targetStudentArr] = await connection.query('SELECT * FROM students WHERE id = ?', [studentId]);
    const student = targetStudentArr[0];
    if (!student) return res.status(404).json({ error: 'Élève non trouvé' });

    const [periods] = await connection.query('SELECT * FROM evaluation_periods WHERE id = ?', [evaluationPeriodId]);
    const period = periods[0];
    const isTrimester = period && period.name && (period.name.toLowerCase().includes('trim') || period.name.toLowerCase().includes('trimester'));

    // 2. Matières et périodes
    const [classSubjects] = await connection.query(
      'SELECT id as subjectId, name, coefficient, category FROM subjects WHERE classId = ? AND schoolYear = ? ORDER BY category, name',
      [classId, schoolYear]
    );

    let periodsToUse = [evaluationPeriodId];
    if (isTrimester) {
      const [allSeqs] = await connection.query("SELECT id FROM evaluation_periods WHERE schoolYear = ? AND type = 'sequence' ORDER BY `order` ASC", [schoolYear]);
      const pName = period.name.toLowerCase();
      if (pName.includes('1') || pName.includes('premi')) periodsToUse = allSeqs.slice(0, 2).map(p => p.id);
      else if (pName.includes('2') || pName.includes('deux') || pName.includes('snd')) periodsToUse = allSeqs.slice(2, 4).map(p => p.id);
      else if (pName.includes('3') || pName.includes('troi')) periodsToUse = allSeqs.slice(4, 6).map(p => p.id);
      else periodsToUse = allSeqs.slice(0, 2).map(p => p.id);
    }

    // 3. Calculer les statistiques globales (Règle du Zéro)
    const [allGrades] = await connection.query(
      'SELECT studentId, subjectId, evaluationPeriodId, score, maxScore FROM grades WHERE evaluationPeriodId IN (?) AND schoolYear = ?',
      [periodsToUse, schoolYear]
    );

    const gradesMap = {};
    allGrades.forEach(g => {
      if (!gradesMap[g.studentId]) gradesMap[g.studentId] = {};
      if (!gradesMap[g.studentId][g.subjectId]) gradesMap[g.studentId][g.subjectId] = {};
      gradesMap[g.studentId][g.subjectId][g.evaluationPeriodId] = (parseFloat(g.score) / parseFloat(g.maxScore)) * 20;
    });

    const studentsStats = [];
    const subjectStudentAverages = {};
    classSubjects.forEach(s => subjectStudentAverages[s.subjectId] = {});

    for (const s of students) {
      let sWeighted = 0, sCoef = 0;
      for (const sub of classSubjects) {
        let subAvg = 0;
        const subGrades = gradesMap[s.id]?.[sub.subjectId] || {};
        if (isTrimester) {
          subAvg = ((subGrades[periodsToUse[0]] || 0) + (subGrades[periodsToUse[1]] || 0)) / 2;
        } else {
          subAvg = subGrades[evaluationPeriodId] || 0;
        }
        const coef = parseFloat(sub.coefficient) || 1;
        sWeighted += subAvg * coef; sCoef += coef;
        subjectStudentAverages[sub.subjectId][s.id] = subAvg;
      }
      studentsStats.push({ id: s.id, average: sCoef > 0 ? sWeighted / sCoef : 0, totalWeighted: sWeighted, totalCoef: sCoef });
    }

    studentsStats.sort((a, b) => b.average - a.average);
    const targetStat = studentsStats.find(s => s.id === studentId);
    const rank = studentsStats.findIndex(s => s.id === studentId) + 1;
    const classAvg = studentsStats.reduce((acc, s) => acc + s.average, 0) / students.length;

    const subjectRanks = {};
    classSubjects.forEach(sub => {
      const sorted = Object.entries(subjectStudentAverages[sub.subjectId]).sort((a, b) => b[1] - a[1]);
      subjectRanks[sub.subjectId] = sorted.findIndex(x => x[0] === studentId) + 1;
    });

    const [savedReport] = await connection.query(
      'SELECT teacherComments, principalComments FROM report_cards WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?',
      [studentId, evaluationPeriodId, schoolYear]
    );
    const tComments = savedReport[0]?.teacherComments || '';
    const pComments = savedReport[0]?.principalComments || '';

    // 4. Générer le PDF
    const [schoolInfoArr] = await connection.query('SELECT * FROM school_info LIMIT 1');
    const schoolInfo = schoolInfoArr[0] || {};
    const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 20, left: 15, right: 15 } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Bulletin_${student.nom}_${evaluationPeriodId}.pdf"`);
    doc.pipe(res);

    // Header Dynamique
    const isBasicParams = student.niveau && (student.niveau.toLowerCase().includes('primaire') || student.niveau.toLowerCase().includes('maternelle') || student.niveau.toLowerCase().includes('sil') || student.niveau.toLowerCase().includes('cp'));
    const ministryFrench = isBasicParams ? "MINISTÈRE DE L'ÉDUCATION DE BASE" : "MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE";
    const ministryEnglish = isBasicParams ? "MINISTRY OF BASIC EDUCATION" : "MINISTRY OF SECONDARY EDUCATION";
    const schoolTypeFrench = isBasicParams ? "ÉCOLE DE BASE" : "ÉCOLE SECONDAIRE";
    const schoolTypeEnglish = isBasicParams ? "BASIC SCHOOL" : "SECONDARY SCHOOL";

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('RÉPUBLIQUE DU CAMEROUN', 10, 10);
    doc.fontSize(7).fillColor('#374151').text('Paix - Travail - Patrie', 10, 20);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af').text(ministryFrench, 10, 30);
    doc.fontSize(7).fillColor('#374151').text(schoolTypeFrench, 10, 40);
    doc.text(`BP: ${schoolInfo.address ? schoolInfo.address.split(',')[0] : 'Yaoundé'}`, 10, 50);
    doc.text(`e-mail: ${schoolInfo.email || 'contact@ecole.cm'}`, 10, 60);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('REPUBLIC OF CAMEROON', 370, 10, { align: 'right', width: 220 });
    doc.fontSize(7).fillColor('#374151').text('Peace - Work - Fatherland', 370, 20, { align: 'right', width: 220 });
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af').text(ministryEnglish, 370, 30, { align: 'right', width: 220 });
    doc.fontSize(7).fillColor('#374151').text(schoolTypeEnglish, 370, 40, { align: 'right', width: 220 });
    doc.text(`P.O BOX ${schoolInfo.address ? schoolInfo.address.split(',')[0] : 'Yaoundé'}`, 370, 50, { align: 'right', width: 220 });
    doc.text(`e-mail: ${schoolInfo.email || 'contact@ecole.cm'}`, 370, 60, { align: 'right', width: 220 });

    if (schoolInfo.logoUrl) {
      try { doc.image(schoolInfo.logoUrl, 250, 15, { width: 40, height: 40 }); }
      catch (e) { drawOfficialEmblem(doc, 250, 15, 40); }
    } else { drawOfficialEmblem(doc, 250, 15, 40); }

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('RELEVÉ DE NOTES', 40, 80, { align: 'center', width: 515 });
    doc.fontSize(9).fillColor('#374151').text('STUDENT REPORT CARD', 40, 95, { align: 'center', width: 515 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text(`Période: ${period.name}`, 15, 110);
    doc.text(`Année scolaire: ${schoolYear}`, 300, 110);
    doc.moveTo(15, 125).lineTo(580, 125).stroke('#e5e7eb', 2);

    const photoY = 140;
    if (student.photoUrl) {
      try { doc.image(student.photoUrl, 15, photoY, { width: 60, height: 60 }); }
      catch (e) { doc.rect(15, photoY, 60, 60).stroke('#e5e7eb'); }
    } else { doc.rect(15, photoY, 60, 60).stroke('#e5e7eb'); }

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
    doc.text(`Nom: ${student.nom}`, 85, photoY + 5);
    doc.text(`Prénom: ${student.prenom}`, 85, photoY + 20);
    doc.text(`Matricule: ${student.id}`, 85, photoY + 35);
    doc.text(`Classe: ${student.classe}`, 85, photoY + 50);

    try {
      const QRCode = require('qrcode');
      const qrD = { i: student.id, n: student.nom, p: period.name, a: targetStat.average.toFixed(2), r: rank };
      const qrB = await QRCode.toBuffer(JSON.stringify(qrD), { width: 60, margin: 1 });
      doc.image(qrB, 520, photoY, { width: 60, height: 60 });
    } catch (e) { }

    doc.moveTo(15, photoY + 75).lineTo(580, photoY + 75).stroke('#e5e7eb', 1);

    let y = photoY + 90;
    doc.rect(15, y, 565, 15).fill('#f3f4f6');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Matière', 20, y + 4);
    doc.text('Note/20', 160, y + 4, { width: 40, align: 'center' });
    doc.text('Coef', 210, y + 4, { width: 30, align: 'center' });
    doc.text('Total', 240, y + 4, { width: 45, align: 'center' });
    doc.text('Rang', 290, y + 4, { width: 45, align: 'center' });
    doc.text('Appréciation', 340, y + 4, { width: 240, align: 'left' });
    y += 15;

    const cats = [...new Set(classSubjects.map(s => s.category))];
    cats.forEach(cat => {
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e40af').text(cat.toUpperCase(), 20, y + 4); y += 14;
      classSubjects.filter(s => s.category === cat).forEach((sub, idx) => {
        const score = subjectStudentAverages[sub.subjectId][studentId];
        if (idx % 2 === 0) doc.rect(15, y, 565, 14).fill('#f9fafb');
        doc.fontSize(7).font('Helvetica').fillColor('#374151');
        doc.text(sub.name, 25, y + 3, { width: 130 });
        doc.font('Helvetica-Bold').text(score.toFixed(2), 160, y + 3, { width: 40, align: 'center' });
        doc.font('Helvetica').text(sub.coefficient, 210, y + 3, { width: 30, align: 'center' });
        doc.text((score * sub.coefficient).toFixed(2), 240, y + 3, { width: 45, align: 'center' });
        doc.text(formatRank(subjectRanks[sub.subjectId]), 290, y + 3, { width: 45, align: 'center' });
        doc.text(getSubjectMention(score), 340, y + 3, { width: 240, align: 'left' });
        y += 14;
      });
    });

    const rTop = y + 10;
    doc.rect(15, rTop, 565, 40).fill('#edf2f7').stroke('#cbd5e0', 1);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af').text('RÉSULTATS GÉNÉRAUX', 25, rTop + 5);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#374151');
    doc.text('Total Points:', 25, rTop + 18); doc.text('Total Coef:', 125, rTop + 18); doc.text('Moyenne:', 225, rTop + 18); doc.text('Rang:', 325, rTop + 18); doc.text('Mention:', 425, rTop + 18); doc.text('Moy. Classe:', 515, rTop + 18);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827');
    doc.text(targetStat.totalWeighted.toFixed(2), 25, rTop + 28); doc.text(targetStat.totalCoef.toFixed(2), 125, rTop + 28); doc.text(`${targetStat.average.toFixed(2)}/20`, 225, rTop + 28); doc.text(`${formatRank(rank)}/${students.length}`, 325, rTop + 28); doc.text(getSubjectMention(targetStat.average), 425, rTop + 28); doc.text(`${classAvg.toFixed(2)}/20`, 515, rTop + 28);

    if (tComments || pComments) {
      y = rTop + 50;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af').text('APPRÉCIATIONS', 15, y);
      doc.fontSize(7).font('Helvetica').fillColor('#374151');
      if (tComments) doc.text(`Professeur: ${tComments}`, 15, y + 12, { width: 565 });
      if (pComments) doc.text(`Principal: ${pComments}`, 15, y + (tComments ? 25 : 12), { width: 565 });
    }

    const signY = 740;
    doc.moveTo(15, signY - 5).lineTo(580, signY - 5).stroke('#e5e7eb', 1);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b');
    doc.text('Le Titulaire / Class Teacher', 40, signY); doc.rect(40, signY + 10, 100, 35).stroke('#9ca3af', 1);
    doc.text('Le Parent / Parent Signature', 250, signY); doc.rect(250, signY + 10, 100, 35).stroke('#9ca3af', 1);
    doc.text('Le Principal / Principal Stamp', 450, signY); doc.rect(450, signY + 10, 100, 35).stroke('#9ca3af', 1);
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 15, 810);

    doc.end();
    connection.release();
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
}
