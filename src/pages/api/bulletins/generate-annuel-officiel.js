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
        const { studentId, classId, schoolYear, decision, targetClass } = req.body;
        if (!studentId || !classId || !schoolYear) return res.status(400).json({ error: 'Paramètres manquants' });

        const pool = await getPoolFromRequest(req, res);
        connection = await pool.getConnection();

        // 1. Récupérer l'élève cible
        const [students] = await connection.query('SELECT * FROM students WHERE id = ?', [studentId]);
        if (students.length === 0) return res.status(404).json({ error: 'Élève non trouvé' });
        const student = students[0];

        // 2. Récupérer les informations de l'école
        const [schoolInfoArr] = await connection.query('SELECT * FROM school_info LIMIT 1');
        const schoolInfo = schoolInfoArr[0] || {};

        // 3. Récupérer TOUS les élèves de la classe pour les stats
        const [allClassStudents] = await connection.query(
            'SELECT id, nom, prenom FROM students WHERE classe = ? AND anneeScolaire = ?',
            [student.classe, schoolYear]
        );
        const totalStudents = allClassStudents.length;

        // 4. Récupérer les matières de la classe
        const [classSubjects] = await connection.query(
            'SELECT id as subjectId, name, coefficient, category FROM subjects WHERE classId = ? AND schoolYear = ?',
            [classId, schoolYear]
        );

        // 5. Récupérer les 6 séquences
        const [sequences] = await connection.query(`
            SELECT id FROM evaluation_periods 
            WHERE schoolYear = ? AND type = 'sequence'
            ORDER BY \`order\` ASC LIMIT 6
        `, [schoolYear]);

        // 6. Calculer les moyennes annuelles de TOUS les élèves (Général + Par Matière)
        const studentAnnualAverages = [];
        const subjectStudentAverages = {}; // { subjectId: { studentId: average } }
        classSubjects.forEach(sub => subjectStudentAverages[sub.subjectId] = {});

        for (const s of allClassStudents) {
            const [sGrades] = await connection.query(
                'SELECT subjectId, evaluationPeriodId, score, maxScore FROM grades WHERE studentId = ? AND schoolYear = ?',
                [s.id, schoolYear]
            );

            const sGradesMap = {};
            sGrades.forEach(g => {
                if (!sGradesMap[g.subjectId]) sGradesMap[g.subjectId] = {};
                sGradesMap[g.subjectId][g.evaluationPeriodId] = (parseFloat(g.score) / parseFloat(g.maxScore)) * 20;
            });

            let sTotalWeighted = 0;
            let sTotalCoef = 0;

            classSubjects.forEach(sub => {
                let sAvg = 0;
                for (let t = 0; t < 3; t++) {
                    const n1 = sequences[t * 2] ? (sGradesMap[sub.subjectId]?.[sequences[t * 2].id] ?? 0) : 0;
                    const n2 = sequences[t * 2 + 1] ? (sGradesMap[sub.subjectId]?.[sequences[t * 2 + 1].id] ?? 0) : 0;
                    sAvg += (n1 + n2) / 2;
                }
                const subAnnAvg = sAvg / 3;
                subjectStudentAverages[sub.subjectId][s.id] = subAnnAvg;

                const coef = parseFloat(sub.coefficient) || 1;
                sTotalWeighted += subAnnAvg * coef;
                sTotalCoef += coef;
            });

            const sAnnAverage = sTotalCoef > 0 ? sTotalWeighted / sTotalCoef : 0;
            studentAnnualAverages.push({ id: s.id, average: sAnnAverage, totalWeighted: sTotalWeighted, totalCoef: sTotalCoef });
        }

        // Calculer Rang Général et Moyenne de Classe
        studentAnnualAverages.sort((a, b) => b.average - a.average);
        const studentStats = studentAnnualAverages.find(s => s.id === studentId);
        const rank = studentAnnualAverages.findIndex(s => s.id === studentId) + 1;
        const classGeneralAverage = studentAnnualAverages.reduce((acc, s) => acc + s.average, 0) / (totalStudents || 1);

        // Calculer les Rangs par Matière pour l'élève cible
        const targetSubjectRanks = {};
        classSubjects.forEach(sub => {
            const scores = Object.entries(subjectStudentAverages[sub.subjectId])
                .map(([sid, avg]) => ({ sid, avg }))
                .sort((a, b) => b.avg - a.avg);
            const subRank = scores.findIndex(x => x.sid === studentId) + 1;
            targetSubjectRanks[sub.subjectId] = subRank;
        });

        // 7. Préparer les résultats détaillés de l'élève cible
        const subjectResults = await Promise.all(classSubjects.map(async (sub) => {
            const annAvg = subjectStudentAverages[sub.subjectId][studentId] || 0;
            const coef = parseFloat(sub.coefficient) || 1;

            // Récupérer les trimestres
            const [targetGrades] = await connection.query(
                'SELECT evaluationPeriodId, score, maxScore FROM grades WHERE studentId = ? AND subjectId = ? AND schoolYear = ?',
                [studentId, sub.subjectId, schoolYear]
            );
            const gMap = {};
            targetGrades.forEach(g => gMap[g.evaluationPeriodId] = (parseFloat(g.score) / parseFloat(g.maxScore)) * 20);

            const trimAvg = [0, 0, 0];
            for (let t = 0; t < 3; t++) {
                const n1 = sequences[t * 2] ? (gMap[sequences[t * 2].id] ?? 0) : 0;
                const n2 = sequences[t * 2 + 1] ? (gMap[sequences[t * 2 + 1].id] ?? 0) : 0;
                trimAvg[t] = (n1 + n2) / 2;
            }

            return {
                id: sub.subjectId,
                name: sub.name,
                category: sub.category || 'AUTRES',
                coef,
                trims: trimAvg,
                annAvg,
                weighted: annAvg * coef,
                rank: targetSubjectRanks[sub.subjectId]
            };
        }));

        // --- GÉNÉRATION DU PDF ---
        const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 20, left: 15, right: 15 } });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Bulletin_Annuel_${student.nom}.pdf"`);
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

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('BULLETIN ANNUEL DE NOTES', 40, 85, { align: 'center', width: 515 });
        doc.fontSize(9).fillColor('#374151').text('ANNUAL STUDENT REPORT CARD', 40, 100, { align: 'center', width: 515 });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text(`Année scolaire: ${schoolYear}`, 40, 115, { align: 'center', width: 515 });
        doc.moveTo(15, 130).lineTo(580, 130).stroke('#e5e7eb', 2);

        // Informations Classe
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('INFORMATIONS DE LA CLASSE / CLASS INFORMATION', 15, 140);
        doc.fontSize(8).font('Helvetica').fillColor('#374151');
        doc.text(`Classe: ${student.classe || 'N/A'}`, 15, 153);
        doc.text(`Niveau: ${student.niveau || 'Primaire'}`, 200, 153);
        doc.text(`Effectif: ${totalStudents}`, 380, 153);
        doc.moveTo(15, 165).lineTo(580, 165).stroke('#e5e7eb', 1);

        // Informations Élève
        const photoY = 185;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('INFORMATIONS DE L\'ÉLÈVE / STUDENT INFORMATION', 15, 175);
        if (student.photoUrl) {
            try { doc.image(student.photoUrl, 15, photoY, { width: 60, height: 60 }); }
            catch (e) { doc.rect(15, photoY, 60, 60).stroke('#e5e7eb'); }
        } else { doc.rect(15, photoY, 60, 60).stroke('#e5e7eb'); }

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
        doc.text(`Matricule: ${student.id}`, 85, photoY + 5);
        doc.text(`Nom: ${student.nom}`, 85, photoY + 20);
        doc.text(`Prénom: ${student.prenom}`, 85, photoY + 35);
        doc.text(`Classe: ${student.classe}`, 85, photoY + 50);

        try {
            const QRCode = require('qrcode');
            const qrD = { i: student.id, n: student.nom, y: schoolYear, a: studentStats.average.toFixed(2), r: rank };
            const qrB = await QRCode.toBuffer(JSON.stringify(qrD), { width: 60, margin: 1 });
            doc.image(qrB, 520, photoY, { width: 60, height: 60 });
            doc.rect(520, photoY, 60, 60).stroke('#1e40af', 1);
        } catch (e) { doc.rect(520, photoY, 60, 60).stroke('#e5e7eb', 1); }

        doc.moveTo(15, photoY + 70).lineTo(580, photoY + 70).stroke('#e5e7eb', 1);

        // Tableau des matières
        const tTop = photoY + 85;
        doc.rect(15, tTop, 565, 15).fill('#f3f4f6');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Matière', 20, tTop + 4);
        doc.text('Trim 1', 170, tTop + 4, { width: 40, align: 'center' });
        doc.text('Trim 2', 210, tTop + 4, { width: 40, align: 'center' });
        doc.text('Trim 3', 250, tTop + 4, { width: 40, align: 'center' });
        doc.text('Moy. Ann', 295, tTop + 4, { width: 45, align: 'center' });
        doc.text('Coef', 345, tTop + 4, { width: 30, align: 'center' });
        doc.text('Total', 380, tTop + 4, { width: 45, align: 'center' });
        doc.text('Rang', 430, tTop + 4, { width: 40, align: 'center' });
        doc.text('Appréciation', 480, tTop + 4, { width: 95, align: 'center' });

        let currentY = tTop + 15;
        const cats = [...new Set(subjectResults.map(s => s.category))];
        cats.forEach(cat => {
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e40af').text(cat.toUpperCase(), 20, currentY + 4);
            currentY += 14;
            subjectResults.filter(s => s.category === cat).forEach((res, i) => {
                if (i % 2 === 0) doc.rect(15, currentY, 565, 14).fill('#f9fafb');
                doc.fontSize(7).font('Helvetica').fillColor('#374151');
                doc.text(res.name, 25, currentY + 3, { width: 140 });
                doc.text(res.trims[0].toFixed(2), 170, currentY + 3, { width: 40, align: 'center' });
                doc.text(res.trims[1].toFixed(2), 210, currentY + 3, { width: 40, align: 'center' });
                doc.text(res.trims[2].toFixed(2), 250, currentY + 3, { width: 40, align: 'center' });
                doc.font('Helvetica-Bold').text(res.annAvg.toFixed(2), 295, currentY + 3, { width: 45, align: 'center' });
                doc.font('Helvetica').text(res.coef, 345, currentY + 3, { width: 30, align: 'center' });
                doc.text(res.weighted.toFixed(2), 380, currentY + 3, { width: 45, align: 'center' });
                doc.text(formatRank(res.rank), 430, currentY + 3, { width: 40, align: 'center' });
                doc.text(getSubjectMention(res.annAvg), 480, currentY + 3, { width: 95, align: 'center' });
                currentY += 14;
            });
        });

        // Résultats Généraux
        const rTop = currentY + 10;
        doc.rect(15, rTop, 565, 40).fill('#f3f4f6').stroke('#d1d5db', 1);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('RÉSULTATS GÉNÉRAUX / GENERAL RESULTS', 25, rTop + 5);
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#374151');
        doc.text('Total Points:', 25, rTop + 18); doc.text('Total Coef:', 125, rTop + 18); doc.text('Moyenne:', 225, rTop + 18); doc.text('Rang:', 325, rTop + 18); doc.text('Mention:', 425, rTop + 18); doc.text('Moy. Classe:', 515, rTop + 18);
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#111827');
        doc.text(studentStats.totalWeighted.toFixed(2), 25, rTop + 28); doc.text(studentStats.totalCoef.toFixed(2), 125, rTop + 28); doc.text(`${studentStats.average.toFixed(2)}/20`, 225, rTop + 28); doc.text(`${formatRank(rank)}`, 325, rTop + 28); doc.text(getSubjectMention(studentStats.average), 425, rTop + 28); doc.text(`${classGeneralAverage.toFixed(2)}/20`, 515, rTop + 28);

        const decY = rTop + 50;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('DÉCISION DU CONSEIL DE CLASSE / CLASS COUNCIL DECISION', 15, decY);
        let dText = '', dColor = '#1e293b';
        if (decision === 'pass') { dText = `PROMU(E) EN CLASSE DE : ${targetClass?.toUpperCase() || 'SUPÉRIEURE'}`; dColor = '#16a34a'; }
        else if (decision === 'exclude') { dText = 'EXCLU(E) DÉFINITIVEMENT'; dColor = '#dc2626'; }
        else { dText = 'REDOUBLE LA CLASSE'; dColor = '#ea580c'; }
        doc.fontSize(9).font('Helvetica-Bold').fillColor(dColor).text(dText, 15, decY + 12, { width: 565 });

        // Footer
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
