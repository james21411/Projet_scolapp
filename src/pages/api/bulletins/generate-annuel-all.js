import { getPoolFromRequest } from '@/lib/pool-from-request';
import PDFDocument from 'pdfkit';
import JSZip from 'jszip';
import { PDFDocument as PDFLib } from 'pdf-lib';

// Fonction pour formater les rangs
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
        const { classId, schoolYear, decisions } = req.body;
        if (!classId || !schoolYear) return res.status(400).json({ error: 'Paramètres manquants' });

        const pool = await getPoolFromRequest(req, res);
        connection = await pool.getConnection();

        // 1. Infos globales
        const [schoolInfoArr] = await connection.query('SELECT * FROM school_info LIMIT 1');
        const schoolInfo = schoolInfoArr[0] || {};
        const [classInfoArr] = await connection.query('SELECT name FROM school_classes WHERE id = ?', [classId]);
        const className = classInfoArr.length > 0 ? classInfoArr[0].name : classId;

        // 2. Récupérer les élèves
        const [students] = await connection.query(
            'SELECT * FROM students WHERE classe = ? AND anneeScolaire = ? ORDER BY nom, prenom',
            [className, schoolYear]
        );
        if (students.length === 0) return res.status(404).json({ error: 'Aucun élève trouvé' });

        // 3. Récupérer toutes les matières de la classe
        const [classSubjects] = await connection.query(
            'SELECT id as subjectId, name, coefficient, category FROM subjects WHERE classId = ? AND schoolYear = ? ORDER BY category, name',
            [classId, schoolYear]
        );

        // 4. Récupérer les 6 séquences
        const [sequences] = await connection.query(`
            SELECT id FROM evaluation_periods 
            WHERE schoolYear = ? AND type = 'sequence'
            ORDER BY \`order\` ASC LIMIT 6
        `, [schoolYear]);

        // 5. Pré-calculer les statistiques (Général et Par Matière) pour TOUS les élèves
        const allStats = [];
        const allSubjectStudentAverages = {}; // { subjectId: { studentId: average } }
        classSubjects.forEach(sub => allSubjectStudentAverages[sub.subjectId] = {});

        for (const s of students) {
            const [grades] = await connection.query(
                'SELECT subjectId, evaluationPeriodId, score, maxScore FROM grades WHERE studentId = ? AND schoolYear = ?',
                [s.id, schoolYear]
            );
            const gMap = {};
            grades.forEach(g => {
                const normalized = (parseFloat(g.score) / parseFloat(g.maxScore)) * 20;
                if (!gMap[g.subjectId]) gMap[g.subjectId] = {};
                gMap[g.subjectId][g.evaluationPeriodId] = normalized;
            });

            let tW = 0, tC = 0;
            classSubjects.forEach(sub => {
                let sAvg = 0;
                for (let t = 0; t < 3; t++) {
                    const n1 = sequences[t * 2] ? (gMap[sub.subjectId]?.[sequences[t * 2].id] ?? 0) : 0;
                    const n2 = sequences[t * 2 + 1] ? (gMap[sub.subjectId]?.[sequences[t * 2 + 1].id] ?? 0) : 0;
                    sAvg += (n1 + n2) / 2;
                }
                const subAnnAvg = sAvg / 3;
                allSubjectStudentAverages[sub.subjectId][s.id] = subAnnAvg;

                const coef = parseFloat(sub.coefficient) || 1;
                tW += subAnnAvg * coef; tC += coef;
            });
            const avg = tC > 0 ? tW / tC : 0;
            allStats.push({ id: s.id, average: avg, totalWeighted: tW, totalCoef: tC });
        }

        // Calculer les Rangs Généraux
        allStats.sort((a, b) => b.average - a.average);
        const classAvg = allStats.reduce((acc, x) => acc + x.average, 0) / students.length;

        // Calculer la Matrice des Rangs par Matière
        const allSubjectRanks = {}; // { subjectId: { studentId: rank } }
        classSubjects.forEach(sub => {
            allSubjectRanks[sub.subjectId] = {};
            const scores = Object.entries(allSubjectStudentAverages[sub.subjectId])
                .map(([sid, avg]) => ({ sid, avg }))
                .sort((a, b) => b.avg - a.avg);
            scores.forEach((item, idx) => {
                allSubjectRanks[sub.subjectId][item.sid] = idx + 1;
            });
        });

        // 6. Génération des PDF
        const zip = new JSZip();
        const individualPdfBuffers = [];
        const pdfTasks = [];

        for (const student of students) {
            const pdfTask = (async () => {
                const sDec = decisions?.[student.id] || { decision: 'repeat', targetClass: className };
                const sStat = allStats.find(x => x.id === student.id);
                const rank = allStats.findIndex(x => x.id === student.id) + 1;

                // Récupérer les notes pour les trimestres individuels
                const [targetGrades] = await connection.query(
                    'SELECT subjectId, evaluationPeriodId, score, maxScore FROM grades WHERE studentId = ? AND schoolYear = ?',
                    [student.id, schoolYear]
                );
                const targetGradesMap = {};
                targetGrades.forEach(g => {
                    if (!targetGradesMap[g.subjectId]) targetGradesMap[g.subjectId] = {};
                    targetGradesMap[g.subjectId][g.evaluationPeriodId] = (parseFloat(g.score) / parseFloat(g.maxScore)) * 20;
                });

                const subjectResults = classSubjects.map(sub => {
                    const trimAvg = [0, 0, 0];
                    for (let t = 0; t < 3; t++) {
                        const n1 = sequences[t * 2] ? (targetGradesMap[sub.subjectId]?.[sequences[t * 2].id] ?? 0) : 0;
                        const n2 = sequences[t * 2 + 1] ? (targetGradesMap[sub.subjectId]?.[sequences[t * 2 + 1].id] ?? 0) : 0;
                        trimAvg[t] = (n1 + n2) / 2;
                    }
                    const annAvg = allSubjectStudentAverages[sub.subjectId][student.id] || 0;
                    const coef = parseFloat(sub.coefficient) || 1;
                    return {
                        id: sub.subjectId,
                        name: sub.name,
                        category: sub.category || 'AUTRES',
                        coef,
                        trims: trimAvg,
                        annAvg,
                        weighted: annAvg * coef,
                        rank: allSubjectRanks[sub.subjectId][student.id]
                    };
                });

                const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 20, left: 15, right: 15 } });
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                const pdfEndPromise = new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));

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

                doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('INFORMATIONS DE LA CLASSE / CLASS INFORMATION', 15, 140);
                doc.fontSize(8).font('Helvetica').fillColor('#374151');
                doc.text(`Classe: ${student.classe || 'N/A'}`, 15, 153);
                doc.text(`Niveau: ${student.niveau || 'Primaire'}`, 200, 153);
                doc.text(`Effectif: ${students.length}`, 380, 153);
                doc.moveTo(15, 165).lineTo(580, 165).stroke('#e5e7eb', 1);

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
                doc.text(`Classe: ${className}`, 85, photoY + 50);

                try {
                    const QRCode = require('qrcode');
                    const qrD = { i: student.id, n: student.nom, y: schoolYear, a: sStat.average.toFixed(2), r: rank };
                    const qrB = await QRCode.toBuffer(JSON.stringify(qrD), { width: 60, margin: 1 });
                    doc.image(qrB, 520, photoY, { width: 60, height: 60 });
                    doc.rect(520, photoY, 60, 60).stroke('#1e40af', 1);
                } catch (e) { doc.rect(520, photoY, 60, 60).stroke('#e5e7eb', 1); }

                doc.moveTo(15, photoY + 70).lineTo(580, photoY + 70).stroke('#e5e7eb', 1);

                let y = photoY + 85;
                doc.rect(15, y, 565, 15).fill('#f3f4f6');
                doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
                doc.text('Matière', 20, y + 4); doc.text('Trim 1', 170, y + 4, { width: 40, align: 'center' }); doc.text('Trim 2', 210, y + 4, { width: 40, align: 'center' }); doc.text('Trim 3', 250, y + 4, { width: 40, align: 'center' }); doc.text('Moy. Ann', 295, y + 4, { width: 45, align: 'center' }); doc.text('Coef', 345, y + 4, { width: 30, align: 'center' }); doc.text('Total', 380, y + 4, { width: 45, align: 'center' }); doc.text('Rang', 430, y + 4, { width: 40, align: 'center' }); doc.text('Appréciation', 480, y + 4, { width: 95, align: 'center' });
                y += 15;

                const cats = [...new Set(subjectResults.map(s => s.category))];
                cats.forEach(cat => {
                    doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e40af').text(cat.toUpperCase(), 20, y + 4); y += 14;
                    subjectResults.filter(s => s.category === cat).forEach((r, i) => {
                        if (i % 2 === 0) doc.rect(15, y, 565, 14).fill('#f9fafb');
                        doc.fontSize(7).font('Helvetica').fillColor('#374151');
                        doc.text(r.name, 25, y + 3, { width: 140 }); doc.text(r.trims[0].toFixed(2), 170, y + 3, { width: 40, align: 'center' }); doc.text(r.trims[1].toFixed(2), 210, y + 3, { width: 40, align: 'center' }); doc.text(r.trims[2].toFixed(2), 250, y + 3, { width: 40, align: 'center' }); doc.font('Helvetica-Bold').text(r.annAvg.toFixed(2), 295, y + 3, { width: 45, align: 'center' }); doc.font('Helvetica').text(r.coef, 345, y + 3, { width: 30, align: 'center' }); doc.text(r.weighted.toFixed(2), 380, y + 3, { width: 45, align: 'center' }); doc.text(formatRank(r.rank), 430, y + 3, { width: 40, align: 'center' }); doc.text(getSubjectMention(r.annAvg), 480, y + 3, { width: 95, align: 'center' });
                        y += 14;
                    });
                });

                // RÉSULTATS GÉNÉRAUX
                const rTop = y + 10;
                doc.rect(15, rTop, 565, 40).fill('#f3f4f6').stroke('#d1d5db', 1);
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('RÉSULTATS GÉNÉRAUX / GENERAL RESULTS', 25, rTop + 5);
                doc.fontSize(7).font('Helvetica-Bold').fillColor('#374151');
                doc.text('Total Points:', 25, rTop + 18); doc.text('Total Coef:', 125, rTop + 18); doc.text('Moyenne:', 225, rTop + 18); doc.text('Rang:', 325, rTop + 18); doc.text('Mention:', 425, rTop + 18); doc.text('Moy. Classe:', 515, rTop + 18);
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#111827');
                doc.text(sStat.totalWeighted.toFixed(2), 25, rTop + 28); doc.text(sStat.totalCoef.toFixed(2), 125, rTop + 28); doc.text(`${sStat.average.toFixed(2)}/20`, 225, rTop + 28); doc.text(`${formatRank(rank)}`, 325, rTop + 28); doc.text(getSubjectMention(sStat.average), 425, rTop + 28); doc.text(`${classAvg.toFixed(2)}/20`, 515, rTop + 28);

                const decY = rTop + 50;
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af').text('DÉCISION DU CONSEIL DE CLASSE / CLASS COUNCIL DECISION', 15, decY);
                let dTxt = '', dCol = '#1e293b';
                if (sDec.decision === 'pass') { dTxt = `PROMU(E) EN CLASSE DE : ${sDec.targetClass?.toUpperCase() || 'SUPÉRIEURE'}`; dCol = '#16a34a'; }
                else if (sDec.decision === 'exclude') { dTxt = 'EXCLU(E) DÉFINITIVEMENT'; dCol = '#dc2626'; }
                else { dTxt = 'REDOUBLE LA CLASSE'; dCol = '#ea580c'; }
                doc.fontSize(9).font('Helvetica-Bold').fillColor(dCol).text(dTxt, 15, decY + 12, { width: 565 });

                const signY = 740;
                doc.moveTo(15, signY - 5).lineTo(580, signY - 5).stroke('#e5e7eb', 1);
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b');
                doc.text('Le Titulaire / Class Teacher', 40, signY); doc.rect(40, signY + 10, 100, 35).stroke('#9ca3af', 1);
                doc.text('Le Parent / Parent Signature', 250, signY); doc.rect(250, signY + 10, 100, 35).stroke('#9ca3af', 1);
                doc.text('Le Principal / Principal Stamp', 450, signY); doc.rect(450, signY + 10, 100, 35).stroke('#9ca3af', 1);
                doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 15, 810);

                doc.end();
                const buffer = await pdfEndPromise;
                zip.file(`${student.nom}_${student.prenom}_Annuel.pdf`, buffer);
                individualPdfBuffers.push(buffer);
            })();
            pdfTasks.push(pdfTask);
        }

        await Promise.all(pdfTasks);
        const merged = await PDFLib.create();
        for (const b of individualPdfBuffers) {
            const s = await PDFLib.load(b);
            const p = await merged.copyPages(s, s.getPageIndices());
            p.forEach(pp => merged.addPage(pp));
        }
        zip.file('Tous_les_bulletins_annuels.pdf', await merged.save());
        const zipB = await zip.generateAsync({ type: 'nodebuffer' });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="Bulletins_Annuels_${className}.zip"`);
        res.send(zipB);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally { if (connection) connection.release(); }
}
